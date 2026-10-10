from __future__ import annotations

import copy
import importlib.util
import json
import tempfile
from pathlib import Path
import unittest

E2 = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location("rb3_r5_e2_dispatch", E2 / "build_dispatch.py")
assert SPEC and SPEC.loader
dispatch = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(dispatch)


class ReviewDispatchTests(unittest.TestCase):
    def test_reviewer_bundle_is_hashable_and_unattested(self):
        outputs,manifest=dispatch.prepare()
        self.assertEqual(len(outputs),17)
        self.assertEqual(manifest["status"],"UNATTESTED_REVIEW_DISPATCH_ONLY")
        self.assertEqual(manifest["source_count"],14)
        self.assertEqual(manifest["row_count"],64)
        self.assertEqual(manifest["reviewed_eligible_rows"],0)
        self.assertFalse(manifest["execution_authorized"])
        self.assertEqual(len([k for k in outputs if k.startswith("dossiers/")]),14)
        self.assertEqual(len(manifest["file_sha256"]),16)

    def test_deterministic_bytes(self):
        a,ma = dispatch.prepare()
        b,mb = dispatch.prepare()
        self.assertEqual(a,b)
        self.assertEqual(ma,mb)
        self.assertEqual(dispatch.digest(a["artifact_manifest.json"]),
                         dispatch.digest(b["artifact_manifest.json"]))

    def test_manifest_hashes_every_output_except_itself(self):
        outputs,manifest=dispatch.prepare()
        self.assertEqual(set(manifest["file_sha256"]),set(outputs)-{"artifact_manifest.json"})
        for name,sha in manifest["file_sha256"].items():
            self.assertEqual(dispatch.digest(outputs[name]),sha)
        self.assertEqual(json.loads(outputs["artifact_manifest.json"]),manifest)

    def test_14_source_disposition_from_frozen_packet(self):
        outputs,_=dispatch.prepare()
        index=outputs["README.md"].decode()
        for n in range(1,15):
            sid=f"RB2-S{n:03d}"
            self.assertIn(sid,index)
            self.assertIn("UNREVIEWED", outputs[f"dossiers/{sid}.md"].decode())

    def test_source_only_studies_not_promoted_as_nulls(self):
        outputs,_=dispatch.prepare()
        for sid in ("RB2-S005","RB2-S007","RB2-S008","RB2-S009","RB2-S013"):
            doc=outputs[f"dossiers/{sid}.md"].decode()
            self.assertIn("Zero extracted candidate",doc)
            self.assertIn("NOT a negative experiment",doc)

    def test_targeted_primary_evidence_questions(self):
        outputs,_=dispatch.prepare()
        self.assertIn("3h versus sham",outputs["dossiers/RB2-S008.md"].decode())
        self.assertIn("Numerical exposure-duration",outputs["dossiers/RB2-S009.md"].decode())
        self.assertIn("Nulled-field",outputs["dossiers/RB2-S013.md"].decode())

    def test_all_64_rows_retain_original_candidate_hash(self):
        packet=dispatch.intake.previous.packet()
        outputs,_=dispatch.prepare()
        for row in packet["row_queue"]:
            dossier=outputs[f"dossiers/{row['source_id']}.md"].decode()
            self.assertIn(row["row_id"],dossier)
            self.assertIn(row["candidate_row_digest_sha256"],dossier)

    def test_reject_fake_approval_during_dossier_build(self):
        packet=dispatch.intake.previous.packet()
        p=copy.deepcopy(next(s for s in packet["source_queue"] if s["source_id"]=="RB2-S008"))
        p["source_outcome"]="REVIEWED_ELIGIBLE"
        with self.assertRaisesRegex(ValueError,"source already appears reviewed"):
            dispatch.dossier_for_source(p,[],None,packet["packet_sha256"])

    def test_reject_incorrectly_approved_candidate(self):
        packet=dispatch.intake.previous.packet()
        source=next(s for s in packet["source_queue"] if s["source_id"]=="RB2-S010")
        candidate=copy.deepcopy(next(r for r in packet["row_queue"] if r["source_id"]=="RB2-S010"))
        candidate["fit_eligible"]=True
        with self.assertRaisesRegex(ValueError,"candidate marked approved"):
            dispatch.dossier_for_source(source,[candidate],None,packet["packet_sha256"])

    def test_safe_markdown_rejects_embedded_html(self):
        escaped=dispatch.md_escape('<script>irrelevant|payload</script>\nnew')
        self.assertNotIn("<script>",escaped)
        self.assertIn("&lt;script&gt;",escaped)
        self.assertIn("\\|",escaped)
        self.assertNotIn("\n",escaped)

    def test_outside_repo_build_and_repeat_refusal(self):
        with tempfile.TemporaryDirectory() as directory:
            root=Path(directory)/"bundle"
            manifest=dispatch.write_bundle(root)
            self.assertEqual(len(list(root.glob("dossiers/*.md"))),14)
            self.assertEqual(json.loads((root/"artifact_manifest.json").read_text()),manifest)
            with self.assertRaisesRegex(ValueError,"new/empty"):
                dispatch.write_bundle(root)

    def test_cannot_write_into_repository(self):
        with self.assertRaisesRegex(ValueError,"outside the tracked repository"):
            dispatch.write_bundle(dispatch.R5/"E2"/"generated")
        with self.assertRaisesRegex(ValueError,"outside the tracked repository"):
            dispatch.write_bundle(dispatch.intake.previous.RB2.parent.parent)

    def test_review_decisions_remain_empty(self):
        state=dispatch.intake.previous.json_file(dispatch.R5/"review_decisions.json")
        self.assertEqual(state["row_decisions"],[])
        self.assertEqual(state["source_decisions"],[])
        self.assertEqual(state["independent_reviewer_attestations"],[])
        self.assertFalse(state["execution_authorized"])


if __name__=="__main__":
    unittest.main()
