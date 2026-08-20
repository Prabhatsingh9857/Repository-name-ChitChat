import React, { useEffect, useRef, useState } from "react";

const CATEGORIES = {
    "😀": [
        "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣",
        "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰",
        "😘", "😗", "😙", "😚", "😋", "😛", "😝", "😜",
        "🤪", "🤨", "🧐", "🤓", "😎", "🥳", "😏", "😒",
        "😞", "😔", "😟", "😕", "🙁", "☹️", "😣", "😖",
        "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡",
        "🤬", "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰",
        "😥", "😓", "🤗", "🤔", "🤭", "🤫", "😶", "😐",
        "😑", "😬", "🙄", "😯", "😮", "😲", "🥱", "😴"
    ],

    "❤️": [
        "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍",
        "🤎", "💔", "❣️", "💕", "💞", "💓", "💗", "💖",
        "💘", "💝", "💟", "♥️", "💌", "💋", "❤️‍🔥"
    ],

    "👍": [
        "👍", "👎", "👏", "🙌", "🙏", "🤝", "💪", "👌",
        "✌️", "🤞", "🤟", "🤘", "👋", "🫶", "👀", "👆",
        "👇", "👉", "👈", "☝️", "✋", "🤚", "🖐️", "🖖",
        "👊", "✊", "🤲", "🤌", "🫰", "🫵"
    ],

    "🐶": [
        "🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼",
        "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵", "🙈",
        "🙉", "🙊", "🐔", "🐧", "🐦", "🐤", "🦄", "🐝",
        "🦋", "🐌", "🐞", "🐢", "🐍", "🦎", "🐙", "🦀"
    ],

    "🍔": [
        "🍎", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🫐",
        "🍒", "🍑", "🥭", "🍍", "🥝", "🍅", "🥑", "🍔",
        "🍕", "🍟", "🌭", "🌮", "🌯", "🍿", "🍗", "🍖",
        "🍜", "🍝", "🍣", "🍱", "🍩", "🍪", "🎂", "🍰",
        "🍫", "🍭", "☕", "🧋", "🥤", "🍺", "🍻"
    ],

    "⚽": [
        "⚽", "🏀", "🏈", "⚾", "🎾", "🏐", "🏉", "🎱",
        "🏓", "🏸", "🥊", "🥋", "⛳", "🏆", "🥇", "🥈",
        "🥉", "🎮", "🎯", "🎳", "🎲", "🎸", "🎹", "🎤",
        "🎧", "🎬", "🎨", "🎭"
    ],

    "🚗": [
        "🚗", "🚕", "🚙", "🚌", "🚎", "🏎️", "🚓", "🚑",
        "🚒", "🚐", "🛻", "🚚", "🚛", "🚜", "🏍️", "🛵",
        "🚲", "✈️", "🚁", "🚀", "🚢", "⛵", "🚂", "🚆"
    ],

    "💡": [
        "💡", "📱", "💻", "⌨️", "🖥️", "🖨️", "📷", "📸",
        "📹", "📞", "☎️", "📺", "📻", "⏰", "⌚", "💰",
        "💳", "🔑", "🔒", "🔓", "📌", "📎", "✏️", "📝",
        "📚", "📖", "📁", "📂", "🗑️"
    ],

    "🎉": [
        "🎉", "🎊", "✨", "⭐", "🌟", "💫", "🔥", "💯",
        "🎈", "🎁", "🎂", "🎆", "🎇", "🎃", "🎄", "🎅",
        "❤️", "💖", "🥳", "🤩", "😎", "👑", "💎"
    ]
};

const EmojiPicker = ({ onSelect, onClose }) => {
    const [activeCategory, setActiveCategory] =
        useState("😀");

    const [search, setSearch] = useState("");

    const pickerRef = useRef(null);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                pickerRef.current &&
                !pickerRef.current.contains(event.target)
            ) {
                onClose?.();
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, [onClose]);

    const emojis = search.trim()
        ? Object.values(CATEGORIES)
              .flat()
              .filter((emoji) =>
                  emoji.includes(search.trim())
              )
        : CATEGORIES[activeCategory];

    return (
        <div
            ref={pickerRef}
            style={{
                position: "absolute",
                bottom: "55px",
                left: "0",
                width: "340px",
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "16px",
                boxShadow:
                    "0 15px 40px rgba(0,0,0,0.18)",
                padding: "12px",
                zIndex: 9999,
            }}
        >
            {/* SEARCH */}

            <input
                type="text"
                value={search}
                onChange={(e) =>
                    setSearch(e.target.value)
                }
                placeholder="Search emoji..."
                style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "9px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    outline: "none",
                    marginBottom: "10px",
                    fontSize: "13px",
                }}
            />

            {/* CATEGORIES */}

            {!search.trim() && (
                <div
                    style={{
                        display: "flex",
                        gap: "4px",
                        borderBottom:
                            "1px solid #f0f0f0",
                        paddingBottom: "8px",
                        marginBottom: "8px",
                        overflowX: "auto",
                    }}
                >
                    {Object.keys(CATEGORIES).map(
                        (category) => (
                            <button
                                key={category}
                                type="button"
                                onClick={() =>
                                    setActiveCategory(
                                        category
                                    )
                                }
                                style={{
                                    border: "none",
                                    background:
                                        activeCategory ===
                                        category
                                            ? "#eef2ff"
                                            : "transparent",
                                    borderRadius: "8px",
                                    padding: "7px",
                                    cursor: "pointer",
                                    fontSize: "20px",
                                    minWidth: "38px",
                                }}
                            >
                                {category}
                            </button>
                        )
                    )}
                </div>
            )}

            {/* EMOJIS */}

            <div
                style={{
                    display: "grid",
                    gridTemplateColumns:
                        "repeat(8, 1fr)",
                    gap: "4px",
                    maxHeight: "230px",
                    overflowY: "auto",
                }}
            >
                {emojis.map(
                    (emoji, index) => (
                        <button
                            key={`${emoji}-${index}`}
                            type="button"
                            onClick={() =>
                                onSelect(emoji)
                            }
                            style={{
                                border: "none",
                                background:
                                    "transparent",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontSize: "23px",
                                height: "34px",
                                display: "flex",
                                alignItems:
                                    "center",
                                justifyContent:
                                    "center",
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                    "#f3f4f6";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                    "transparent";
                            }}
                        >
                            {emoji}
                        </button>
                    )
                )}
            </div>
        </div>
    );
};

export default EmojiPicker;