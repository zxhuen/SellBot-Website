import document from "@/site/zxhuenGarage/document.generated.json";

// Serve the standalone HTML document directly, including its compiled Tailwind
// styles and local interactions. This route deliberately has no email endpoint.
export function GET() {
  return new Response(document.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
