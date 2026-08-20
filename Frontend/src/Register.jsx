import { useState } from "react";

const API_URL = "http://https://chitchat-backend-dpbp.onrender.com";

function Register({ onRegister, onGoToLogin }) {
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleRegister = async (e) => {
        e.preventDefault();

        setError("");
        setSuccess("");

        // ========================================
        // VALIDATION
        // ========================================

        if (!username.trim()) {
            setError("Please enter username.");
            return;
        }

        if (!email.trim()) {
            setError("Please enter email.");
            return;
        }

        if (!password) {
            setError("Please enter password.");
            return;
        }

        if (password.length < 6) {
            setError(
                "Password must be at least 6 characters."
            );
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            console.log(
                "================================"
            );
            console.log("CHIT CHAT REGISTER");
            console.log(
                "URL:",
                `${API_URL}/api/auth/register`
            );
            console.log(
                "================================"
            );

            // ========================================
            // REGISTER REQUEST
            // ========================================

            const response = await fetch(
                `${API_URL}/api/auth/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        username:
                            username.trim(),

                        email:
                            email.trim(),

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
            } catch (error) {
                console.error(
                    "Invalid server response:",
                    error
                );

                setError(
                    "Server returned an invalid response."
                );

                return;
            }

            console.log(
                "Registration status:",
                response.status
            );

            console.log(
                "Registration response:",
                data
            );

            // ========================================
            // REGISTRATION FAILED
            // ========================================

            if (!response.ok) {
                setError(
                    data?.message ||
                        "Registration failed."
                );

                return;
            }

            // ========================================
            // SUCCESS
            // ========================================

            setSuccess(
                "Account created successfully!"
            );

            console.log(
                "Registration successful."
            );

            // ========================================
            // IF BACKEND RETURNS TOKEN + USER
            // ========================================

            if (data?.token && data?.user) {
                localStorage.setItem(
                    "token",
                    data.token
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                if (
                    typeof onRegister ===
                    "function"
                ) {
                    setTimeout(() => {
                        onRegister(data.user);
                    }, 500);
                }

                return;
            }

            // ========================================
            // IF BACKEND ONLY RETURNS USER
            // ========================================

            setTimeout(() => {
                if (
                    typeof onGoToLogin ===
                    "function"
                ) {
                    onGoToLogin();
                }
            }, 1000);
        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            setError(
                "Unable to connect to Chit Chat server. Make sure the backend is running on port 5000."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background:
                    "linear-gradient(135deg, #f8f9fc, #eef2ff)",
                padding: "20px",
            }}
        >
            <div
                style={{
                    width: "100%",
                    maxWidth: "430px",
                    background: "#ffffff",
                    padding: "35px",
                    borderRadius: "20px",
                    boxShadow:
                        "0 10px 35px rgba(0,0,0,0.08)",
                }}
            >
                {/* LOGO */}

                <div
                    style={{
                        textAlign: "center",
                        marginBottom: "25px",
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
                            margin: 0,
                            color: "#172033",
                            fontSize: "28px",
                            fontWeight: "700",
                        }}
                    >
                        Create Account
                    </h1>

                    <p
                        style={{
                            marginTop: "8px",
                            color: "#8b95a7",
                        }}
                    >
                        Join Chit Chat
                    </p>
                </div>

                {/* ERROR */}

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
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* SUCCESS */}

                {success && (
                    <div
                        style={{
                            padding: "12px",
                            marginBottom: "18px",
                            borderRadius: "10px",
                            background:
                                "#dcfce7",
                            color: "#15803d",
                            fontSize: "14px",
                        }}
                    >
                        {success}
                    </div>
                )}

                <form onSubmit={handleRegister}>
                    {/* USERNAME */}

                    <div
                        style={{
                            marginBottom: "16px",
                        }}
                    >
                        <label
                            style={{
                                display: "block",
                                marginBottom: "7px",
                                fontWeight: "600",
                                color: "#374151",
                            }}
                        >
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(
                                    e.target.value
                                )
                            }
                            placeholder="Enter username"
                            autoComplete="username"
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
                            }}
                        />
                    </div>

                    {/* EMAIL */}

                    <div
                        style={{
                            marginBottom: "16px",
                        }}
                    >
                        <label
                            style={{
                                display: "block",
                                marginBottom: "7px",
                                fontWeight: "600",
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
                                    e.target.value
                                )
                            }
                            placeholder="Enter email"
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
                            }}
                        />
                    </div>

                    {/* PASSWORD */}

                    <div
                        style={{
                            marginBottom: "16px",
                        }}
                    >
                        <label
                            style={{
                                display: "block",
                                marginBottom: "7px",
                                fontWeight: "600",
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
                                    e.target.value
                                )
                            }
                            placeholder="Minimum 6 characters"
                            autoComplete="new-password"
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
                            }}
                        />
                    </div>

                    {/* CONFIRM PASSWORD */}

                    <div
                        style={{
                            marginBottom: "22px",
                        }}
                    >
                        <label
                            style={{
                                display: "block",
                                marginBottom: "7px",
                                fontWeight: "600",
                                color: "#374151",
                            }}
                        >
                            Confirm Password
                        </label>

                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(
                                    e.target.value
                                )
                            }
                            placeholder="Enter password again"
                            autoComplete="new-password"
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
                            }}
                        />
                    </div>

                    {/* REGISTER */}

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
                            ? "Creating Account..."
                            : "Create Account"}
                    </button>
                </form>

                {/* LOGIN */}

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
                    Already have an account?

                    <button
                        type="button"
                        onClick={onGoToLogin}
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
                        Login
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Register;