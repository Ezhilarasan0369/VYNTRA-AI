let conversationHistory = [];

// ==========================================
// VYNTRA AI - FRONTEND JAVASCRIPT
// Cloudflare Worker + Gemini + Tavily
// ==========================================

const API_URL =
    "https://vyntra-ai-api.ezhilarasanpofficial.workers.dev";

const GOOGLE_CLIENT_ID =
    "271448546787-sabrgtig9evo5mbkhhnpnpet5g1mrvj8.apps.googleusercontent.com";

let currentUser = null;


// ==========================================
// GOOGLE INITIALIZATION
// ==========================================

window.onload = function () {

    const googleButton =
        document.getElementById("googleSignInButton");

    if (!googleButton) {

        console.error(
            "VYNTRA AI: Google sign-in container not found."
        );

        return;
    }


    if (
        !window.google ||
        !window.google.accounts ||
        !window.google.accounts.id
    ) {

        console.error(
            "VYNTRA AI: Google Identity Services SDK is not available."
        );

        alert(
            "Google Sign-In could not load. Please refresh the page and try again."
        );
       
        return;
    }


    google.accounts.id.initialize({

        client_id:
            GOOGLE_CLIENT_ID,

        callback:
            handleGoogleLogin,

        auto_select:
            false,

        cancel_on_tap_outside:
            true

    });


    google.accounts.id.renderButton(

        googleButton,

        {

            theme:
                "outline",

            size:
                "large",

            shape:
                "pill",

            text:
                "continue_with",

            width:
                280

        }

    );

};


// ==========================================
// GOOGLE LOGIN + ACCESS CONTROL
// ==========================================

async function handleGoogleLogin(response) {

    try {

        if (!response || !response.credential) {
            throw new Error(
                "Google sign-in did not return a credential."
            );
        }

        // Send the Google credential to the Worker.
        // The Worker should verify the credential server-side.
        const googleResponse = await fetch(
            API_URL + "/google-auth",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    credential: response.credential
                })
            }
        );

        const googleData =
            await googleResponse.json().catch(() => ({}));

        console.log(
            "Google authentication:",
            googleData
        );

        if (!googleResponse.ok || !googleData.success) {

            if (googleData.status === "pending") {

                alert(
                    "Your access request is waiting for administrator approval."
                );

                return;
            }

            if (googleData.status === "denied") {

                alert(
                    "Your access request was denied."
                );

                return;
            }

            throw new Error(
                googleData.error ||
                "Google authentication failed."
            );
        }

        currentUser = {
            name: googleData.user?.name || "",
            email: String(
                googleData.user?.email || ""
            ).trim().toLowerCase(),
            picture: googleData.user?.picture || "",
            mobile: googleData.user?.mobile || "",
            status: "approved"
        };

        localStorage.setItem(
            "vyntra_user",
            JSON.stringify(currentUser)
        );

        openVyntraAI();

    }
    catch (error) {

        console.error(
            "VYNTRA AI Google login failed:",
            error
        );

        alert(
            error?.message ||
            "Unable to complete Google Sign-In."
        );

        currentUser = null;
    }
}


// ==========================================
// EMAIL / MOBILE PASSWORD LOGIN
// ==========================================

async function handlePasswordLogin() {

    const identifier =
        document.getElementById(
            "loginIdentifier"
        )?.value.trim();

    const password =
        document.getElementById(
            "loginPassword"
        )?.value || "";

    const message =
        document.getElementById(
            "loginMessage"
        );

    if (!identifier || !password) {

        if (message) {
            message.textContent =
                "Enter your email/mobile and password.";
        }

        return;
    }

    if (message) {
        message.textContent =
            "Signing in...";
    }

    try {

        const response =
            await fetch(
                API_URL + "/login",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        identifier,
                        password
                    })
                }
            );

        const data =
            await response
                .json()
                .catch(() => ({}));

        if (
            !response.ok ||
            !data.success
        ) {

            if (message) {
                message.textContent =
                    data.error ||
                    "Login failed.";
            }

            return;
        }

        currentUser = {
            name:
                data.name || "",

            email:
                String(
                    data.email || ""
                )
                    .trim()
                    .toLowerCase(),

            picture:
                data.picture || "",

            mobile:
                data.mobile || "",

            status:
                "approved"
        };

        localStorage.setItem(
            "vyntra_user",
            JSON.stringify(currentUser)
        );

        if (message) {
            message.textContent = "";
        }

        openVyntraAI();

    }
    catch (error) {

        console.error(
            "Password login error:",
            error
        );

        if (message) {
            message.textContent =
                "Server error. Please try again.";
        }
    }
}


// ==========================================
// CREATE ACCOUNT / REQUEST ACCESS
// ==========================================

async function handleSignup() {

    const name =
        document.getElementById(
            "signupName"
        )?.value.trim();

    const email =
        document.getElementById(
            "signupEmail"
        )?.value.trim();

    const mobile =
        document.getElementById(
            "signupMobile"
        )?.value.trim();

    const password =
        document.getElementById(
            "signupPassword"
        )?.value || "";

    const confirmPassword =
        document.getElementById(
            "signupConfirmPassword"
        )?.value || "";

    const message =
        document.getElementById(
            "signupMessage"
        );

    if (
        !name ||
        !email ||
        !mobile ||
        !password ||
        !confirmPassword
    ) {

        if (message) {
            message.textContent =
                "Please fill all fields.";
        }

        return;
    }

    if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {

        if (message) {
            message.textContent =
                "Enter a valid email address.";
        }

        return;
    }

    if (!/^\d{10}$/.test(mobile)) {

        if (message) {
            message.textContent =
                "Enter a valid 10-digit mobile number.";
        }

        return;
    }

    if (password.length < 8) {

        if (message) {
            message.textContent =
                "Password must be at least 8 characters.";
        }

        return;
    }

    if (password !== confirmPassword) {

        if (message) {
            message.textContent =
                "Passwords do not match.";
        }

        return;
    }

    if (message) {
        message.textContent =
            "Submitting access request...";
    }

    try {

        const response =
            await fetch(
                API_URL + "/signup",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        mobile,
                        password,
                        confirmPassword
                    })
                }
            );

        const data =
            await response
                .json()
                .catch(() => ({}));

        console.log(
            "Signup response:",
            data
        );

        if (
            !response.ok ||
            !data.success
        ) {

            if (message) {
                message.textContent =
                    data.error ||
                    "Signup failed.";
            }

            return;
        }

        if (
            data.status ===
            "approved"
        ) {

            if (message) {
                message.textContent =
                    "This account is already approved. Please sign in.";
            }

            return;
        }

        if (message) {
            message.textContent =
                "✓ Request submitted successfully. Wait for admin approval.";
        }

        const passwordInput =
            document.getElementById(
                "signupPassword"
            );

        const confirmInput =
            document.getElementById(
                "signupConfirmPassword"
            );

        if (passwordInput) {
            passwordInput.value = "";
        }

        if (confirmInput) {
            confirmInput.value = "";
        }

    }
    catch (error) {

        console.error(
            "Signup error:",
            error
        );

        if (message) {
            message.textContent =
                "Server error. Please try again.";
        }
    }
}


// ==========================================
// AUTH BUTTON EVENTS
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const loginButton =
            document.getElementById(
                "loginButton"
            );

        if (loginButton) {

            loginButton.addEventListener(
                "click",
                handlePasswordLogin
            );

        }

        const signupButton =
            document.getElementById(
                "signupButton"
            );

        if (signupButton) {

            signupButton.addEventListener(
                "click",
                handleSignup
            );

        }

        const loginPassword =
            document.getElementById(
                "loginPassword"
            );

        if (loginPassword) {

            loginPassword.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        handlePasswordLogin();

                    }

                }
            );

        }

        const signupConfirmPassword =
            document.getElementById(
                "signupConfirmPassword"
            );

        if (signupConfirmPassword) {

            signupConfirmPassword.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter"
                    ) {

                        event.preventDefault();

                        handleSignup();

                    }

                }
            );

        }

    }
);

// ==========================================
// OPEN VYNTRA AI AFTER APPROVAL
// ==========================================

function openVyntraAI() {

    const loginScreen =
        document.getElementById(
            "loginScreen"
        );


    const mainApp =
        document.getElementById(
            "mainApp"
        );


    if (loginScreen) {

        loginScreen.style.display =
            "none";

    }


    if (mainApp) {

        mainApp.style.display =
            "flex";

    }


    setTimeout(

        () => {

            document
                .getElementById(
                    "heroInput"
                )
                ?.focus();

        },

        150

    );

}


// ==========================================
// JWT PARSER
// ==========================================

function parseJwt(token) {

    if (!token) {

        throw new Error(
            "Google credential is missing."
        );

    }


    const parts =
        token.split(".");


    if (
        parts.length !== 3
    ) {

        throw new Error(
            "Invalid Google credential."
        );

    }


    const base64Url =
        parts[1];


    const base64 =
        base64Url
            .replace(
                /-/g,
                "+"
            )
            .replace(
                /_/g,
                "/"
            );


    const jsonPayload =
        decodeURIComponent(

            atob(base64)

                .split("")

                .map(
                    function (c) {

                        return "%" +

                            (
                                "00" +
                                c.charCodeAt(0)
                                    .toString(16)
                            )
                                .slice(-2);

                    }
                )

                .join("")

        );


    return JSON.parse(
        jsonPayload
    );

}


// ==========================================
// ELEMENTS
// ==========================================

const heroInput =
    document.getElementById(
        "heroInput"
    );


const heroSend =
    document.getElementById(
        "heroSend"
    );


const userInput =
    document.getElementById(
        "userInput"
    );


const sendBtn =
    document.getElementById(
        "sendBtn"
    );


const welcome =
    document.getElementById(
        "welcome"
    );


const messages =
    document.getElementById(
        "messages"
    );


const bottomInputArea =
    document.getElementById(
        "bottomInputArea"
    );


const newChat =
    document.getElementById(
        "newChat"
    );


const clearChat =
    document.getElementById(
        "clearChat"
    );


const sidebar =
    document.getElementById(
        "sidebar"
    );


const menuButton =
    document.getElementById(
        "menuButton"
    );


const closeMenu =
    document.getElementById(
        "closeMenu"
    );


const mobileOverlay =
    document.getElementById(
        "mobileOverlay"
    );


// ==========================================
// CHAT STATE
// ==========================================

let chatStarted =
    false;


let isGenerating =
    false;


// ==========================================
// SEND MESSAGE
// ==========================================

async function sendMessage(message) {

    const text =
        message.trim();


    if (
        !text ||
        isGenerating
    ) {

        return;

    }


    // --------------------------------------
    // CHECK LOGIN
    // --------------------------------------

    if (
        !currentUser ||
        !currentUser.email
    ) {

        alert(
            "Please sign in first."
        );

        return;

    }


    isGenerating =
        true;


    startChat();


    addMessage(
        text,
        "user"
    );


    clearInputs();


    const typingElement =
        showTyping();


    setSendButtonsDisabled(
        true
    );


    try {

        console.log(
            "Sending message to VYNTRA AI..."
        );


        const response =
            await fetch(

                API_URL + "/chat",

                {

                    method:
                        "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            message:
                                text,

                            email:
                                currentUser.email,

                            history:
                                conversationHistory

                        })

                }

            );


        const data =
            await response
                .json()
                .catch(
                    () => ({})
                );


        if (
            typingElement
        ) {

            typingElement.remove();

        }


        // ----------------------------------
        // API ERROR
        // ----------------------------------

        if (
            !response.ok
        ) {

            const errorMessage =

                data.error ||

                data.message ||

                "Something went wrong.";


            addMessage(

                errorMessage,

                "bot",

                true

            );


            return;

        }


        // ----------------------------------
        // BOT RESPONSE
        // ----------------------------------

        const reply =

            data.reply ||

            "I couldn't generate a response.";


        let finalReply =
            reply;


        // ----------------------------------
        // LIVE SEARCH SOURCES
        // ----------------------------------

        if (

            data.liveSearchUsed &&

            Array.isArray(
                data.sources
            ) &&

            data.sources.length > 0

        ) {

            finalReply +=
                "\n\nSources:\n";


            data.sources.forEach(

                (
                    source,
                    index
                ) => {

                    if (
                        source &&
                        source.url
                    ) {

                        finalReply +=

                            `${index + 1}. ` +

                            `[${source.title || source.url}]` +

                            `(${source.url})\n`;

                    }

                }

            );

        }


        // ----------------------------------
        // SAVE HISTORY
        // ----------------------------------

        conversationHistory.push({

            role:
                "user",

            text:
                text

        });


        conversationHistory.push({

            role:
                "assistant",

            text:
                finalReply

        });


        // Keep recent messages only

        if (
            conversationHistory.length >
            20
        ) {

            conversationHistory =
                conversationHistory.slice(
                    -20
                );

        }


        addMessage(

            finalReply,

            "bot"

        );

    }


    catch (error) {

        console.error(

            "VYNTRA AI Error:",

            error

        );


        if (
            typingElement
        ) {

            typingElement.remove();

        }


        addMessage(

            "DEBUG ERROR: " +

            (
                error?.message ||
                String(error)
            ),

            "bot",

            true

        );

    }


    finally {

        isGenerating =
            false;


        setSendButtonsDisabled(
            false
        );


        userInput?.focus();

    }

}


// ==========================================
// START CHAT UI
// ==========================================

function startChat() {

    if (
        chatStarted
    ) {

        return;

    }


    chatStarted =
        true;


    if (
        welcome
    ) {

        welcome.style.display =
            "none";

    }


    if (
        messages
    ) {

        messages.style.display =
            "flex";

    }


    if (
        bottomInputArea
    ) {

        bottomInputArea.classList.add(
            "active"
        );

    }

}


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(

    text,

    type,

    isError = false

) {

    if (
        !messages
    ) {

        return;

    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        `message-row ${type}`;


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        `message-avatar ${type}`;


    avatar.textContent =

        type === "user"

            ? "EP"

            : "AI";


    const bubble =
        document.createElement(
            "div"
        );


    bubble.className =
        `message-bubble ${type}`;


    if (
        isError
    ) {

        bubble.classList.add(
            "error-message"
        );

    }


    // --------------------------------------
    // BOT MARKDOWN
    // --------------------------------------

    if (
        type === "bot" &&
        !isError
    ) {

        if (
            typeof marked !==
            "undefined"
        ) {

            bubble.innerHTML =
                marked.parse(
                    text,
                    {
                        breaks:
                            true
                    }
                );

        }

        else {

            bubble.textContent =
                text;

        }

    }

    else {

        bubble.textContent =
            text;

    }


    // --------------------------------------
    // USER MESSAGE
    // --------------------------------------

    if (
        type === "user"
    ) {

        row.appendChild(
            bubble
        );

        row.appendChild(
            avatar
        );

    }


    // --------------------------------------
    // BOT MESSAGE
    // --------------------------------------

    else {

        row.appendChild(
            avatar
        );

        row.appendChild(
            bubble
        );

    }


    messages.appendChild(
        row
    );


    scrollToBottom();

}


// ==========================================
// TYPING INDICATOR
// ==========================================

function showTyping() {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "message-row bot typing-row";


    const avatar =
        document.createElement(
            "div"
        );


    avatar.className =
        "message-avatar bot";


    avatar.textContent =
        "AI";


    const typing =
        document.createElement(
            "div"
        );


    typing.className =
        "message-bubble bot typing";


    typing.innerHTML = `

        <span></span>

        <span></span>

        <span></span>

    `;


    row.appendChild(
        avatar
    );


    row.appendChild(
        typing
    );


    messages.appendChild(
        row
    );


    scrollToBottom();


    return row;

}


// ==========================================
// HERO INPUT
// ==========================================

if (
    heroSend
) {

    heroSend.addEventListener(

        "click",

        () => {

            if (
                !heroInput
            ) {

                return;

            }


            sendMessage(
                heroInput.value
            );

        }

    );

}


if (
    heroInput
) {

    heroInput.addEventListener(

        "keydown",

        function (event) {

            if (

                event.key ===
                "Enter"

                &&

                !event.shiftKey

            ) {

                event.preventDefault();


                sendMessage(
                    heroInput.value
                );

            }

        }

    );


    heroInput.addEventListener(

        "input",

        () => {

            autoResize(
                heroInput
            );

        }

    );

}


// ==========================================
// BOTTOM CHAT INPUT
// ==========================================

if (
    sendBtn
) {

    sendBtn.addEventListener(

        "click",

        () => {

            if (
                !userInput
            ) {

                return;

            }


            sendMessage(
                userInput.value
            );

        }

    );

}


if (
    userInput
) {

    userInput.addEventListener(

        "keydown",

        function (event) {

            if (

                event.key ===
                "Enter"

                &&

                !event.shiftKey

            ) {

                event.preventDefault();


                sendMessage(
                    userInput.value
                );

            }

        }

    );


    userInput.addEventListener(

        "input",

        () => {

            autoResize(
                userInput
            );

        }

    );

}


// ==========================================
// QUICK SUGGESTION CARDS
// ==========================================

function useSuggestion(
    text
) {

    if (
        heroInput
    ) {

        heroInput.value =
            text;

    }


    sendMessage(
        text
    );

}


// Make available to HTML onclick

window.useSuggestion =
    useSuggestion;


// ==========================================
// NEW CHAT
// ==========================================

if (
    newChat
) {

    newChat.addEventListener(

        "click",

        resetChat

    );

}


// ==========================================
// CLEAR CHAT
// ==========================================

if (
    clearChat
) {

    clearChat.addEventListener(

        "click",

        resetChat

    );

}


// ==========================================
// RESET CHAT
// ==========================================

function resetChat() {

    conversationHistory =
        [];


    chatStarted =
        false;


    isGenerating =
        false;


    if (
        messages
    ) {

        messages.innerHTML =
            "";


        messages.style.display =
            "none";

    }


    if (
        welcome
    ) {

        welcome.style.display =
            "";

    }


    if (
        bottomInputArea
    ) {

        bottomInputArea.classList.remove(
            "active"
        );

    }


    clearInputs();


    setSendButtonsDisabled(
        false
    );


    closeSidebar();


    setTimeout(

        () => {

            heroInput?.focus();

        },

        100

    );

}


// ==========================================
// CLEAR INPUTS
// ==========================================

function clearInputs() {

    if (
        heroInput
    ) {

        heroInput.value =
            "";

        heroInput.style.height =
            "auto";

    }


    if (
        userInput
    ) {

        userInput.value =
            "";

        userInput.style.height =
            "auto";

    }

}


// ==========================================
// TEXTAREA AUTO RESIZE
// ==========================================

function autoResize(
    element
) {

    if (
        !element
    ) {

        return;

    }


    element.style.height =
        "auto";


    element.style.height =

        Math.min(

            element.scrollHeight,

            150

        ) +

        "px";

}


// ==========================================
// SCROLL TO BOTTOM
// ==========================================

function scrollToBottom() {

    if (
        !messages
    ) {

        return;

    }


    setTimeout(

        () => {

            messages.scrollTop =
                messages.scrollHeight;

        },

        50

    );

}


// ==========================================
// BUTTON DISABLE
// ==========================================

function setSendButtonsDisabled(
    disabled
) {

    if (
        heroSend
    ) {

        heroSend.disabled =
            disabled;

    }


    if (
        sendBtn
    ) {

        sendBtn.disabled =
            disabled;

    }

}


// ==========================================
// MOBILE SIDEBAR
// ==========================================

function openSidebar() {

    if (
        sidebar
    ) {

        sidebar.classList.add(
            "open"
        );

    }


    if (
        mobileOverlay
    ) {

        mobileOverlay.classList.add(
            "active"
        );

    }

}


function closeSidebar() {

    if (
        sidebar
    ) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (
        mobileOverlay
    ) {

        mobileOverlay.classList.remove(
            "active"
        );

    }

}


if (
    menuButton
) {

    menuButton.addEventListener(

        "click",

        openSidebar

    );

}


if (
    closeMenu
) {

    closeMenu.addEventListener(

        "click",

        closeSidebar

    );

}


if (
    mobileOverlay
) {

    mobileOverlay.addEventListener(

        "click",

        closeSidebar

    );

}


// ==========================================
// ESC CLOSES SIDEBAR
// ==========================================

document.addEventListener(

    "keydown",

    function (event) {

        if (
            event.key ===
            "Escape"
        ) {

            closeSidebar();

        }

    }

);


// ==========================================
// RESTORE SAVED APPROVED USER
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        try {

            const saved =
                localStorage.getItem(
                    "vyntra_user"
                );

            if (!saved) {
                return;
            }

            const user =
                JSON.parse(saved);

            if (
                user &&
                user.email &&
                user.status === "approved"
            ) {

                currentUser = user;

                openVyntraAI();

            }

        }
        catch (error) {

            console.error(
                "Could not restore saved user:",
                error
            );

            localStorage.removeItem(
                "vyntra_user"
            );

        }

    }
);


// ==========================================
// INITIAL SETUP
// ==========================================

document.addEventListener(

    "DOMContentLoaded",

    () => {

        if (
            messages
        ) {

            messages.style.display =
                "none";

        }


        if (
            bottomInputArea
        ) {

            bottomInputArea.classList.remove(
                "active"
            );

        }


        setTimeout(

            () => {

                heroInput?.focus();

            },

            300

        );

    }

);
