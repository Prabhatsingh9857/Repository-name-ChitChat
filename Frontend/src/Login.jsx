import { useState } from "react";

const API_URL = "http://https://chitchat-backend-dpbp.onrender.com";

function Login({ onLogin, onGoToRegister }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // ========================================
    // LOGIN
    // ========================================

    const handleLogin = async (e) => {
        e.preventDefault();

        setError("");

        // ----------------------------
        // VALIDATION
        // ----------------------------

        if (!email.trim()) {
            setError("Please enter your email");
            return;
        }

        if (!password) {
            setError("Please enter your password");
            return;
        }

        try {
            setLoading(true);

            console.log("================================");
            console.log("CHIT CHAT LOGIN");
            console.log("API:", `${API_URL}/api/auth/login`);
            console.log("Email:", email.trim());
            console.log("================================");

            // ========================================
            // LOGIN REQUEST
            // ========================================

            const response = await fetch(
                `${API_URL}/api/auth/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                    },

                    body: JSON.stringify({
                        email: email.trim(),
                        password,
                    }),
                }
            );

            // ========================================
            // READ RESPONSE
            // ========================================

            let data;

            try {
                data = await response.json();
            } catch (jsonError) {
                console.error(
                    "Invalid server response:",
                    jsonError
                );

                setError(
                    "Server returned an invalid response"
                );

                return;
            }

            console.log(
                "Login status:",
                response.status
            );

            console.log(
                "Login response:",
                data
            );

            // ========================================
            // LOGIN FAILED
            // ========================================

            if (!response.ok) {
                setError(
                    data?.message ||
                        "Invalid email or password"
                );

                return;
            }

            // ========================================
            // CHECK TOKEN
            // ========================================

            if (!data?.token) {
                console.error(
                    "Login succeeded but token is missing:",
                    data
                );

                setError(
                    "Login failed: authentication token missing"
                );

                return;
            }

            // ========================================
            // CHECK USER
            // ========================================

            if (!data?.user) {
                console.error(
                    "Login succeeded but user is missing:",
                    data
                );

                setError(
                    "Login failed: user information missing"
                );

                return;
            }

            // ========================================
            // SAVE TOKEN
            // ========================================

            localStorage.setItem(
                "token",
                data.token
            );

            // ========================================
            // SAVE USER
            // ========================================

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            console.log(
                "Login successful"
            );

            console.log(
                "User:",
                data.user
            );

            // ========================================
            // TELL APP LOGIN SUCCEEDED
            // ========================================

            if (typeof onLogin === "function") {
                onLogin(data.user);
            }
        } catch (error) {
            console.error(
                "LOGIN ERROR:",
                error
            );

            // Network / backend unavailable
            setError(
                "Unable to connect to Chit Chat server. Make sure the backend is running on port 5000."
            );
        } finally {
            setLoading(false);
        }
    };

    // ========================================
    // UI
    // ========================================

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    "linear-gradient(135deg, #f8f9fc 0%, #eef2ff 100%)",
                padding: "20px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    padding: "35px",
                    background: "#ffffff",
                    borderRadius: "20px",
                    boxShadow:
                        "0 10px 35px rgba(0, 0, 0, 0.08)",
                }}
            >
                {/* =================================
                    LOGO
                ================================= */}

                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "30px",
                    }}
                >
                    <img
                        src="/logo.png"
                        alt="Chit Chat"
                        style={{
                            width: "70px",
                            height: "70px",
                            objectFit: "contain",
                            margin:
                                "0 auto 10px",
                        }}
                    />

                    <h1
                        style={{
                            margin: "0",
                            color: "#172033",
                            fontSize: "28px",
                            fontWeight: "700",
                        }}
                    >
                        Chit Chat
                    </h1>

                    <p
                        style={{
                            color: "#8b95a7",
                            marginTop: "8px",
                            marginBottom: "0",
                        }}
                    >
                        Login to continue
                    </p>
                </div>

                {/* =================================
                    ERROR
                ================================= */}

                {error && (
                    <div
                        style={{
                            padding: "12px",
                            marginBottom: "18px",
                            borderRadius: "10px",
                            background:
                                "#fee2e2",
                            color: "#dc2626",
                            fontSize: "14px",
                            lineHeight: "1.4",
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* =================================
                    FORM
                ================================= */}

                <form onSubmit={handleLogin}>
                    {/* EMAIL */}

                    <div
                        style={{
                            marginBottom: "18px",
                        }}
                    >
                        <label
                            style={{
                                display: "block",
                                marginBottom:
                                    "7px",
                                fontWeight:
                                    "600",
                                color: "#374151",
                            }}
                        >
                            Email
                        </label>

                        <input
                            type="email"
                            value={email}
                            onChange={(e) =>
                                setEmail(
                                    e.target
                                        .value
                                )
                            }
                            placeholder="Enter your email"
                            autoComplete="email"
                            disabled={loading}
                            style={{
                                width: "100%",
                                boxSizing:
                                    "border-box",
                                padding:
                                    "13px 14px",
                                border:
                                    "1px solid #dfe3eb",
                                borderRadius:
                                    "10px",
                                fontSize:
                                    "15px",
                                outline: "none",
                                background:
                                    loading
                                        ? "#f3f4f6"
                                        : "#ffffff",
                            }}
                        />
                    </div>

                    {/* PASSWORD */}

                    <div
                        style={{
                            marginBottom: "20px",
                        }}
                    >
                        <label
                            style={{
                                display: "block",
                                marginBottom:
                                    "7px",
                                fontWeight:
                                    "600",
                                color: "#374151",
                            }}
                        >
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target
                                        .value
                                )
                            }
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={loading}
                            style={{
                                width: "100%",
                                boxSizing:
                                    "border-box",
                                padding:
                                    "13px 14px",
                                border:
                                    "1px solid #dfe3eb",
                                borderRadius:
                                    "10px",
                                fontSize:
                                    "15px",
                                outline: "none",
                                background:
                                    loading
                                        ? "#f3f4f6"
                                        : "#ffffff",
                            }}
                        />
                    </div>

                    {/* LOGIN BUTTON */}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            width: "100%",
                            padding: "14px",
                            border: "none",
                            borderRadius:
                                "10px",
                            background:
                                "#6366f1",
                            color: "#ffffff",
                            fontSize: "16px",
                            fontWeight: "600",
                            cursor: loading
                                ? "not-allowed"
                                : "pointer",
                            opacity: loading
                                ? 0.7
                                : 1,
                        }}
                    >
                        {loading
                            ? "Logging in..."
                            : "Login"}
                    </button>
                </form>

                {/* =================================
                    REGISTER LINK
                ================================= */}

                <div
                    style={{
                        marginTop: "24px",
                        paddingTop: "20px",
                        borderTop:
                            "1px solid #eeeeee",
                        textAlign: "center",
                        color: "#8b95a7",
                        fontSize: "14px",
                    }}
                >
                    Don't have an account?

                    <button
                        type="button"
                        onClick={() => {
                            if (
                                typeof onGoToRegister ===
                                "function"
                            ) {
                                onGoToRegister();
                            }
                        }}
                        style={{
                            marginLeft: "6px",
                            padding: 0,
                            border: "none",
                            background:
                                "transparent",
                            color: "#6366f1",
                            fontWeight:
                                "600",
                            cursor: "pointer",
                            fontSize: "14px",
                        }}
                    >
                        Create Account
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Login;