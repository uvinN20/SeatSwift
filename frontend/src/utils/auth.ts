export type Role = "ADMIN" | "PASSENGER" | "BUS_OWNER";

export const getToken = (): string | null => {
  return localStorage.getItem("token");
};

export const setToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// The role is stored by the login pages. It is only used to pick screens;
// the backend enforces every permission from the signed token.
export const getRole = (): Role | null => {
  const role = localStorage.getItem("role");
  return role === "ADMIN" || role === "PASSENGER" || role === "BUS_OWNER" ? role : null;
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
};

/** Display-only: the token's subject (email / username). Never used for authorization. */
export const getAccountName = (): string | null => {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(payload)) as { sub?: string };
    return json.sub ?? null;
  } catch {
    return null;
  }
};
