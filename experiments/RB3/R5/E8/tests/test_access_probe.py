from __future__ import annotations

import copy
import importlib.util
import json
import tempfile
from pathlib import Path
import unittest

E8 = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("nbg_r5_e8_probe",E8/"access_probe.py")
assert SPEC and SPEC.loader
probe=importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(probe)

RB3_SPEC=importlib.util.spec_from_file_location("nbg_r5_e8_frozen",E8.parents[1]/"src"/"rb3.py")
assert RB3_SPEC and RB3_SPEC.loader
frozen=importlib.util.module_from_spec(RB3_SPEC)
RB3_SPEC.loader.exec_module(frozen)


def source(index=2):
    return probe.expected_sources()[index]


def mock_response(s,oa="Y",pdf="Y",pmcid="PMC98765"):
    return {"resultList":{"result":[{
        "id":s["pmid"],"source":"MED","doi":s["doi"],
        "pmcid":pmcid,"isOpenAccess":oa,"hasPDF":pdf,
    }]}}


class LegalAccessProbeTests(unittest.TestCase):
    def test_offline_source_and_review_lock(self):
        status=probe.audit()
        self.assertEqual(status["frozen_unresolved_sources"],5)
        self.assertEqual(status["missing_lineages"],["L005","L006","L010"])
        self.assertEqual(status["independent_reviews"],0)
        self.assertEqual(status["approved_model_rows"],0)
        self.assertFalse(status["real_execution_authorized"])
        self.assertEqual(len(status["generated_pmid_queries"]),5)

    def test_exact_pmid_queries(self):
        x=probe.query_url("22676915")
        self.assertTrue(x.startswith(probe.ENDPOINT+"?"))
        self.assertIn("EXT_ID%3A22676915",x)
        self.assertIn("SRC%3AMED",x)
        self.assertIn("format=json",x)

    def test_oa_metadata_still_unreviewed(self):
        s=source()
        r=probe.interpret(s,mock_response(s))
        probe.check_record(s,r)
        self.assertEqual(r["probe_state"],probe.STATUS["OA_METADATA_ROUTE"])
        self.assertEqual(r["candidate_repository_url"],"https://europepmc.org/articles/PMC98765")
        for key in ("fulltext_retrieved","fulltext_figures_checked",
                    "license_verified","independent_review_approved","fit_authorized"):
            self.assertFalse(r[key])
        self.assertEqual(r["new_model_rows"],0)

    def test_pdf_indicator_is_not_open_access(self):
        s=source()
        r=probe.interpret(s,mock_response(s,oa="N",pdf="Y",pmcid=None))
        self.assertEqual(r["probe_state"],probe.STATUS["NOT_CONFIRMED"])
        self.assertEqual(r["has_pdf_metadata"],"Y")
        self.assertIsNone(r["candidate_repository_url"])
        probe.check_record(s,r)

    def test_oa_yes_without_pmcid_does_not_create_verified_route(self):
        s=source()
        r=probe.interpret(s,mock_response(s,oa="Y",pdf="Y",pmcid=None))
        self.assertEqual(r["probe_state"],probe.STATUS["NOT_CONFIRMED"])
        self.assertIsNone(r["candidate_repository_url"])

    def test_network_error_is_not_no_paper(self):
        s=source()
        r=probe.interpret(s,None,error="TimeoutError")
        self.assertEqual(r["probe_state"],probe.STATUS["NETWORK"])
        self.assertIn("cannot infer absence",r["diagnostic"])
        probe.check_record(s,r)

    def test_empty_provider_result_not_proof_no_article(self):
        s=source()
        r=probe.interpret(s,{"resultList":{"result":[]}})
        self.assertEqual(r["probe_state"],probe.STATUS["NOT_INDEXED"])
        self.assertIn("not evidence fulltext does not exist",r["diagnostic"])

    def test_changed_pubmed_identifier_refused(self):
        s=source()
        fake=mock_response(s)
        fake["resultList"]["result"][0]["id"]="999999"
        r=probe.interpret(s,fake)
        self.assertEqual(r["probe_state"],probe.STATUS["INVALID"])
        self.assertIsNone(r["candidate_repository_url"])

    def test_changed_doi_refused(self):
        s=source()
        fake=mock_response(s)
        fake["resultList"]["result"][0]["doi"]="10.0000/other"
        r=probe.interpret(s,fake)
        self.assertEqual(r["probe_state"],probe.STATUS["INVALID"])

    def test_mismatching_database_source_refused(self):
        s=source()
        fake=mock_response(s)
        fake["resultList"]["result"][0]["source"]="AGR"
        r=probe.interpret(s,fake)
        self.assertEqual(r["probe_state"],probe.STATUS["INVALID"])

    def test_duplicate_provider_match_cannot_authenticate(self):
        s=source()
        fake=mock_response(s)
        fake["resultList"]["result"].append(copy.deepcopy(fake["resultList"]["result"][0]))
        self.assertEqual(probe.interpret(s,fake)["probe_state"],probe.STATUS["INVALID"])

    def test_tampering_lawful_candidate_url_refused(self):
        s=source()
        r=probe.interpret(s,mock_response(s))
        r["candidate_repository_url"]="https://some-other-place.invalid/full-paper"
        with self.assertRaisesRegex(ValueError,"OA route promoted"):
            probe.check_record(s,r)

    def test_tampering_fulltext_inspection_refused(self):
        s=source()
        r=probe.interpret(s,mock_response(s))
        r["fulltext_figures_checked"]=True
        with self.assertRaisesRegex(ValueError,"unverified access/science promoted"):
            probe.check_record(s,r)

    def test_tampering_independent_review_refused(self):
        s=source()
        r=probe.interpret(s,mock_response(s))
        r["independent_review_approved"]=True
        with self.assertRaisesRegex(ValueError,"unverified access/science promoted"):
            probe.check_record(s,r)

    def test_cannot_invent_eligible_rows(self):
        s=source()
        r=probe.interpret(s,mock_response(s))
        r["new_model_rows"]=1
        with self.assertRaisesRegex(ValueError,"fabricated experimental rows"):
            probe.check_record(s,r)

    def test_cannot_enable_real_fit_in_policy(self):
        d=probe.load(probe.REGISTRY)
        d["execution_authorized"]=True
        with self.assertRaisesRegex(ValueError,"training authorized"):
            probe.check_policy(d)

    def test_cannot_disable_pdf_distinction_in_policy(self):
        d=probe.load(probe.REGISTRY)
        d["never_assume_hasPDF_means_open_access"]=False
        with self.assertRaisesRegex(ValueError,"fulltext handling safety rule disabled"):
            probe.check_policy(d)

    def test_all_five_records_report_metadata_only(self):
        src=probe.expected_sources()
        rs=[probe.interpret(s,{"resultList":{"result":[]}}) for s in src]
        report=probe.build_report(rs,"OFFLINE_READINESS_NO_NETWORK")
        self.assertEqual(report["sources_checked"],5)
        self.assertEqual(report["metadata_oa_route_candidates"],0)
        self.assertEqual(report["actual_fulltext_figures_inspected"],0)
        self.assertFalse(report["model_execution_authorized"])
        self.assertIn("No publisher article body",probe.markdown(report))
        self.assertEqual(report["scientific_status"],probe.STOP)

    def test_report_cannot_raise_fit_status_via_records(self):
        src=probe.expected_sources()
        rs=[probe.interpret(s,{"resultList":{"result":[]}}) for s in src]
        rs[0]["fit_authorized"]=True
        with self.assertRaisesRegex(ValueError,"unverified access/science promoted"):
            probe.build_report(rs,"OFFLINE_READINESS_NO_NETWORK")

    def test_original_candidate_real_fit_still_refused(self):
        with self.assertRaisesRegex(RuntimeError,"REFUSED_RB3_REAL_ROWS"):
            frozen.execute(probe.RB3/"R0/candidate_rows.csv")


if __name__=="__main__":
    unittest.main()
