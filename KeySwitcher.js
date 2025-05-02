// @ts-nocheck
import * as script from "../../../../../script.js";
import * as secrets from "../../../../../scripts/secrets.js";
import * as oai from "../../../../../scripts/openai.js";
import * as popup from "../../../../../scripts/popup.js";
import { SECRET_KEYS } from "../../../../../scripts/secrets.js";

// --- DEFINE CONSTANTS AND HELPERS FIRST ---

function getProviderDataSecretKey(baseSecretKey) {
    return `${baseSecretKey}_key_sets_data`;
}

const PROVIDERS = {
    OPENROUTER: {
        name: "OpenRouter",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'openrouter', // Corrected access
        secret_key: SECRET_KEYS.OPENROUTER,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.OPENROUTER),
        form_id: "openrouter_form",
        input_id: "api_key_openrouter",
        get_form: () => document.getElementById("openrouter_form"), // Safer access
    },
    ANTHROPIC: {
        name: "Anthropic (Claude)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'claude', // Corrected access
        secret_key: SECRET_KEYS.CLAUDE,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.CLAUDE),
        form_id: "claude_form",
        input_id: "api_key_claude",
        get_form: () => document.getElementById("claude_form"), // Safer access
    },
    OPENAI: {
        name: "OpenAI",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'openai', // Corrected access
        secret_key: SECRET_KEYS.OPENAI,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.OPENAI),
        form_id: "openai_form",
        input_id: "api_key_openai",
        get_form: () => document.getElementById("openai_form"), // Safer access
    },
     // ... other providers defined similarly, ensuring safe access for get_form ...
     // GEMINI, DEEPSEEK, XAI etc.
    GEMINI: {
        name: "Google AI Studio (Gemini)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'google', // Corrected access
        secret_key: SECRET_KEYS.MAKERSUITE,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.MAKERSUITE),
        form_id: "makersuite_form",
        input_id: "api_key_makersuite",
        get_form: () => document.getElementById("makersuite_form"), // Safer access
    },
    DEEPSEEK: {
        name: "DeepSeek",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'deepseek', // Corrected access
        secret_key: SECRET_KEYS.DEEPSEEK,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.DEEPSEEK),
        form_id: "deepseek_form",
        input_id: "api_key_deepseek",
        get_form: () => document.getElementById("deepseek_form"), // Safer access
    },
    XAI: {
        name: "Xai (Grok)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'xai', // Corrected access
        secret_key: SECRET_KEYS.XAI,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.XAI),
        form_id: "xai_form",
        input_id: "api_key_xai",
        get_form: () => document.getElementById("xai_form"), // Safer access
    }
};

const PROVIDER_ERROR_MAPPINGS = { /* ...unchanged... */ };
const REMOVAL_STATUS_CODES = [400, 401, 403, 404, 429];
const REMOVAL_MESSAGE_REGEX = /Unauthorized|Forbidden|Permission|Invalid|Exceeded|Internal/i;

// --- Global Toggles State (Initialize Early - NOW SAFE) ---
let keySwitchingEnabled = {};
let showErrorDetails = {};

Object.values(PROVIDERS).forEach(provider => { // <-- Line 17 (or around here) should now work
    keySwitchingEnabled[provider.secret_key] = localStorage.getItem(`switch_key_${provider.secret_key}_dynamic`) === "true";
    showErrorDetails[provider.secret_key] = localStorage.getItem(`show_${provider.secret_key}_error_dynamic`) !== "false";
});

// --- DEFINE ALL OTHER FUNCTIONS HERE ---
// (isProviderSource, showErrorPopup, getSecrets, saveKey, getDefaultSetData, loadSetData, saveSetData, etc.)
// (getActiveKeysString, splitKeys, updateProviderInfoPanel, handleKeyRotation, handleKeyRemoval, createButton, init, redrawProviderUI)

function isProviderSource(provider) {
    // Ensure oaiFunctions and oai_settings are available before checking
    if (oai && oai.oai_settings && provider && typeof provider.source_check === 'function') {
        return provider.source_check();
    }
    // console.warn("isProviderSource called before oai_settings available or provider invalid.");
    return false;
}

// ... Implementations for all other functions ...
// showErrorPopup, getSecrets, saveKey, loadSetData, saveSetData, handleKeyRotation,
// handleKeyRemoval, redrawProviderUI, updateProviderInfoPanel, splitKeys,
// getActiveKeysString, getDefaultSetData, createButton, init

// --- Override toastr.error (Define Early, make robust) ---
const originalToastrError = toastr.error;
toastr.error = async function(...args) {
    // ... (the robust toastr.error implementation from the previous step) ...
     originalToastrError(...args); // Call the original first
     console.log("Toastr Error Args:", args);
     console.error(...args);

     const [errorMessage, errorTitle] = args;

     // Check if oaiFunctions and settings are ready before proceeding
     if (!oai || !oai.oai_settings) {
         console.warn("KeySwitcher: toastr.error called before oai_settings are ready.");
         return;
     }

     // Proceed only if settings are ready
     for (const provider of Object.values(PROVIDERS)) {
         if (isProviderSource(provider)) {
             console.log(`Error occurred while ${provider.name} was active.`);
             let keyRemoved = false;
             let removedKeyValue = null;
             const currentSwitchingEnabled = keySwitchingEnabled[provider.secret_key];
             const failedKey = await secretsFunctions.findSecret(provider.secret_key);

             if (failedKey && currentSwitchingEnabled) {
                 // Key removal/rotation logic
                  const statusCodeMatch = errorMessage.match(/\b(\d{3})\b/);
                  let statusCode = null;
                  if (statusCodeMatch) statusCode = parseInt(statusCodeMatch[1], 10);
                  const isRemovalStatusCode = REMOVAL_STATUS_CODES.includes(statusCode);
                  const isRemovalMessage = REMOVAL_MESSAGE_REGEX.test(errorMessage);

                  if (isRemovalStatusCode || isRemovalMessage) {
                      const newKey = await handleKeyRemoval(provider, failedKey);
                      if (newKey !== null) {
                          keyRemoved = true;
                          removedKeyValue = failedKey;
                      }
                  } else {
                      await handleKeyRotation(provider.secret_key);
                  }
             }

             if (showErrorDetails[provider.secret_key]) {
                 showErrorPopup(provider, errorMessage, errorTitle || `${provider.name} API Error`, keyRemoved, removedKeyValue);
             }
             break;
         }
     }
};


// --- Main Initialization Logic (Inside Event Listener) ---
let isInitialized = false;

script.eventSource.on(script.event_types.CHAT_COMPLETION_SETTINGS_READY, async () => {
    if (isInitialized) {
       return;
    }
    isInitialized = true;
    console.log("KeySwitcher (Dynamic Sets): CHAT_COMPLETION_SETTINGS_READY received. Initializing UI...");

    // Now safe to load secrets
    const initialLoadedSecrets = await getSecrets(); // This call uses secretsFunctions
    if (!initialLoadedSecrets) {
        console.error("MultiProviderKeySwitcher: Failed to load secrets AFTER settings ready.");
        toastr.error("KeySwitcher: Failed to load secrets. Key management disabled.", "Initialization Error");
        return;
    }
    await init(initialLoadedSecrets); // This call uses init function

    // --- UI Setup Loop ---
    for (const provider of Object.values(PROVIDERS)) { // Uses PROVIDERS constant
        console.log(`Setting up UI for provider: ${provider.name}`);
        const formElement = provider.get_form(); // Uses PROVIDERS properties
        if (!formElement) {
            console.warn(`Could not find form element for ${provider.name}`);
            continue;
        }

        // Load data
        const data = await loadSetData(provider, initialLoadedSecrets); // Uses loadSetData, PROVIDERS

        if (formElement.querySelector(`#keyswitcher-main-${provider.secret_key}`)) {
            console.log(`KeySwitcher UI for ${provider.name} already present.`);
             await redrawProviderUI(provider, data); // Uses redrawProviderUI
            continue;
        }

        // Create containers etc.
        const mainContainer = document.createElement("div"); // ... standard DOM ...
        mainContainer.id = `keyswitcher-main-${provider.secret_key}`;
        // ... rest of UI element creation ...

        const heading = document.createElement("h4"); // ... standard DOM ...
        // ... heading setup ...
        mainContainer.appendChild(heading);

        const infoPanel = document.createElement("div"); // ... standard DOM ...
        // ... infoPanel setup ...
        mainContainer.appendChild(infoPanel);

        const globalButtonContainer = document.createElement("div"); // ... standard DOM ...
        // ... button container setup ...
        mainContainer.appendChild(globalButtonContainer);

        // Create Buttons (using corrected createButton calls without await)
        const keySwitchingButton = createButton(/*...*/); // Uses createButton
        const rotateManuallyButton = createButton(/*...*/); // Uses createButton
        const errorToggleButton = createButton(/*...*/); // Uses createButton
        globalButtonContainer.appendChild(keySwitchingButton);
        globalButtonContainer.appendChild(rotateManuallyButton);
        globalButtonContainer.appendChild(errorToggleButton);

        const dynamicSetsContainer = document.createElement("div"); // ... standard DOM ...
        dynamicSetsContainer.id = `keyswitcher-sets-dynamic-${provider.secret_key}`;
        mainContainer.appendChild(dynamicSetsContainer);

        // Inject UI
        const insertBeforeElement = formElement.querySelector('hr:not(.key-switcher-hr), button, .form_section_block');
        const separatorHr = document.createElement("hr");
        separatorHr.classList.add("key-switcher-hr");
        // ... injection logic ...

        // Initial Draw
        await redrawProviderUI(provider, data); // Uses redrawProviderUI
    }

    // --- Initial Rotation Check ---
    console.log("Initial setup complete. Performing initial rotation check.");
    // const currentSource = oai.oai_settings.chat_completion_source; // Safe now
    for (const provider of Object.values(PROVIDERS)) { // Uses PROVIDERS
        if (isProviderSource(provider)) { // Uses isProviderSource
            if (keySwitchingEnabled[provider.secret_key]) { // Uses global toggle
                await handleKeyRotation(provider.secret_key); // Uses handleKeyRotation
            }
            break;
        }
    }

    console.log("KeySwitcher (Dynamic Sets): Initialization complete.");

}); // End of listener

// --- Export ---
// Make sure 'init' function is defined before this line
function init(loadedSecrets) { // Simple init function
     console.log("MultiProviderKeySwitcher (Dynamic Sets) init function called.");
     // You could potentially store loadedSecrets globally if needed elsewhere,
     // but maybe not necessary if primarily used within the event listener.
}
export default init;
