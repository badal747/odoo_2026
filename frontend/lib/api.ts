import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage if available
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("peoplepay_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle session expiration (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined" && error?.response?.status === 401) {
      if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/register")) {
        localStorage.removeItem("peoplepay_token");
        localStorage.removeItem("peoplepay_user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function getPayslipPdfUrl(slipId: string, download: boolean = false): string {
  const token = typeof window !== "undefined" ? localStorage.getItem("peoplepay_token") : "";
  const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  const params = new URLSearchParams();
  if (token) params.set("token", token);
  if (download) params.set("download", "true");
  const qs = params.toString();
  return `${base}/payslips/${slipId}/pdf${qs ? `?${qs}` : ""}`;
}

export async function downloadPayslipPdfBlob(slipId: string, filename?: string): Promise<void> {
  const response = await api.get(`/payslips/${slipId}/pdf?download=true`, {
    responseType: "blob",
  });
  const blob = new Blob([response.data], { type: "application/pdf" });
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename || `Payslip_${slipId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 15000);
}

export default api;

