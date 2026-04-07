import crypto from "crypto";

export default function verifyProxy(request) {
  const url = new URL(request.url);

  const signature = url.searchParams.get("signature");

  const params = [];
  url.searchParams.forEach((value, key) => {
    if (key !== "signature") {
      params.push(`${key}=${value}`);
    }
  });

  const message = params.sort().join("");

  const generated = crypto
    .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  return generated === signature;
}