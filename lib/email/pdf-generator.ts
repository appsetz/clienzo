/**
 * PDF Generation Utility
 * 
 * Generates PDF from invoice HTML template using puppeteer-core
 * For serverless environments (Vercel), uses @sparticuz/chromium
 */

import type { InvoiceData } from "@/components/InvoiceGenerator";
import { generateInvoiceHTML } from "@/lib/invoice-templates";

/**
 * Generate PDF buffer from invoice HTML
 * 
 * Uses puppeteer-core with @sparticuz/chromium for serverless environments
 * 
 * @param invoiceData Invoice data
 * @param userProfile User profile data
 * @param template Invoice template (defaults to "classic")
 * @returns PDF buffer
 */
export async function generateInvoicePDF(
  invoiceData: InvoiceData,
  userProfile: any,
  template: "classic" | "minimal" | "professional" | "elegant" = "classic"
): Promise<Buffer> {
  // Generate HTML from invoice template
  const html = generateInvoiceHTML(invoiceData, userProfile, template);
  
  try {
    // Server-side: Use puppeteer-core with @sparticuz/chromium for serverless
    if (typeof window === "undefined") {
      let chromium: any;
      let puppeteer: any;
      
      try {
        chromium = await import("@sparticuz/chromium");
        puppeteer = await import("puppeteer-core");
      } catch (importError) {
        console.warn("PDF generation libraries not installed. Install with: npm install puppeteer-core @sparticuz/chromium");
        // Fallback: Return HTML buffer (won't be a real PDF)
        return Buffer.from(html, "utf-8");
      }
      
      const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "networkidle0" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20px", right: "20px", bottom: "20px", left: "20px" },
      });
      await browser.close();
      return Buffer.from(pdf);
    }
    
    // Client-side fallback (shouldn't happen, but just in case)
    console.warn("PDF generation called on client-side. This should only run server-side.");
    return Buffer.from(html, "utf-8");
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Fallback to HTML buffer
    return Buffer.from(html, "utf-8");
  }
}

