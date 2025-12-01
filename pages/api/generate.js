import axios from "axios";

export default async function handler(req, res) {
  try {
    const { city, category } = req.query;

    const q = `${category} in ${city}`;
    const apiKey = process.env.GOOGLE_API_KEY;

    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      q
    )}&key=${apiKey}`;

    const response = await axios.get(url);

    const places = response.data.results || [];

    const leads = places.map((p) => ({
      name: p.name || "",
      address: p.formatted_address || "",
      phone: p.formatted_phone_number || "",
    }));

    res.json({ leads });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch leads" });
  }
}
