import axios from "axios";

export async function importFreelancerRating(username) {
  try {
    const res = await axios.post("/user/import_freelancer_rating", {
      username,
    });
    return { ok: true, data: res.data };
  } catch (err) {
    return {
      ok: false,
      error: err.response?.data?.error || "Import failed",
    };
  }
}
