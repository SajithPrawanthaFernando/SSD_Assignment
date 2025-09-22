import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuthContext } from "../hooks/useAuthContext";

const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:5000";

export default function OAuthSuccess() {
  const navigate = useNavigate();
  const { dispatch } = useAuthContext();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        navigate("/login");
        return;
      }

      localStorage.setItem("token", token);
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;

      try {
        const { data } = await axios.get(`${API_URL}/gauth/me`);

        dispatch({ type: "LOGIN", payload: { ...data, token } });
        localStorage.setItem("user", JSON.stringify(data));
      } catch (e) {
        console.error("Failed to fetch /auth/me", e);
      }

      navigate("/");
    })();
  }, [dispatch, navigate]);

  return null;
}
