// @ts-nocheck
import * as script from "../../../../../script.js";
import * as secrets from "../../../../../scripts/secrets.js";
import * as oai from "../../../../../scripts/openai.js";
import * as popup from "../../../../../scripts/popup.js";
import { SECRET_KEYS } from "../../../../../scripts/secrets.js";

// --- Webpack Wrapper (Keep if present in original, otherwise ignore) ---
var __webpack_module_cache__ = {};
function __webpack_require__(moduleId) { /* ... */ }
var __webpack_modules__ = {};
__webpack_modules__.d = (exports, definition) => { /* ... */ };
__webpack_modules__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop));
const exports = {};
__webpack_modules__.d(exports, { default: () => init });
// --- End Webpack Wrapper ---


// Import functions
const scriptFunctions = {
    eventSource: script.eventSource,
    event_types: script.event_types,
    getRequestHeaders: script.getRequestHeaders,
    saveSettingsDebounced: script.saveSettingsDebounced
};
const secretsFunctions = {
    updateSecretDisplay: secrets.updateSecretDisplay,
    writeSecret: secrets.writeSecret,
    findSecret: secrets.findSecret
};
const oaiFunctions = {
    oai_settings: oai.oai_settings
};
const popupFunctions = {
    POPUP_TYPE: popup.POPUP_TYPE,
    callGenericPopup: popup.callGenericPopup
};

// Helper function to create the name for the secret storing set data
function getProviderDataSecretKey(baseSecretKey) {
    return `${baseSecretKey}_key_sets_data`;
}

// Provider sources and keys - MODIFIED for Set Data
const PROVIDERS = {
    OPENROUTER: {
        name: "OpenRouter",
        source_check: () => ["openrouter"].includes(oaiFunctions.oai_settings.chat_completion_source),
        secret_key: SECRET_KEYS.OPENROUTER,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.OPENROUTER), // Using new data key
        form_id: "openrouter_form",
        input_id: "api_key_openrouter",
        get_form: () => document.getElementById("openrouter_form"),
    },
    ANTHROPIC: {
        name: "Anthropic (Claude)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'claude',
        secret_key: SECRET_KEYS.CLAUDE,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.CLAUDE), // Using new data key
        form_id: "claude_form",
        input_id: "api_key_claude",
        get_form: () => document.getElementById("claude_form"),
    },
    OPENAI: {
        name: "OpenAI",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'openai',
        secret_key: SECRET_KEYS.OPENAI,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.OPENAI), // Using new data key
        form_id: "openai_form",
        input_id: "api_key_openai",
        get_form: () => document.getElementById("openai_form"),
    },
    GEMINI: {
        name: "Google AI Studio (Gemini)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'google',
        secret_key: SECRET_KEYS.MAKERSUITE,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.MAKERSUITE), // Using new data key
        form_id: "makersuite_form",
        input_id: "api_key_makersuite",
        get_form: () => document.getElementById("makersuite_form"),
    },
    DEEPSEEK: {
        name: "DeepSeek",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'deepseek',
        secret_key: SECRET_KEYS.DEEPSEEK,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.DEEPSEEK), // Using new data key
        form_id: "deepseek_form",
        input_id: "api_key_deepseek",
        get_form: () => document.getElementById("deepseek_form"),
    },
    XAI: {
        name: "Xai (Grok)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'xai',
        secret_key: SECRET_KEYS.XAI,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.XAI), // Using new data key
        form_id: "xai_form",
        input_id: "api_key_xai",
        get_form: () => document.getElementById("xai_form"),
    }
};

// Provider-specific error details
const PROVIDER_ERROR_MAPPINGS = { /* ...unchanged from original... */ };
// Removal Triggers
const REMOVAL_STATUS_CODES = [400, 401, 403, 404, 429];
const REMOVAL_MESSAGE_REGEX = /Unauthorized|Forbidden|Permission|Invalid|Exceeded|Internal/i;

// Check if current source matches a provider
const isProviderSource = (provider) => provider.source_check();

// Key switching state - Per provider
let keySwitchingEnabled = {};
let showErrorDetails = {};

// Initialize states from localStorage
Object.values(PROVIDERS).forEach(provider => {
    keySwitchingEnabled[provider.secret_key] = localStorage.getItem(`switch_key_${provider.secret_key}`) === "true";
    showErrorDetails[provider.secret_key] = localStorage.getItem(`show_${provider.secret_key}_error`) !== "false";
});

// Show error information popup (Enhanced from original, kept as is for now)
function showErrorPopup(provider, errorMessage, errorTitle = "API Error", wasKeyRemoved = false, removedKey = null) {
    let popupContent = `<h3>${errorTitle}</h3>`;
    let statusCode = null;
    let detailedError = null;
    const statusCodeMatch = errorMessage.match(/\b(\d{3})\b/);
    if (statusCodeMatch) statusCode = parseInt(statusCodeMatch[1], 10);
    try {
        const jsonMatch = errorMessage.match(/({.*})/);
        if (jsonMatch && jsonMatch[1]) detailedError = JSON.parse(jsonMatch[1]).error;
    } catch (e) { console.warn("Could not parse detailed error from message:", e); }
    const providerMapping = PROVIDER_ERROR_MAPPINGS[provider?.secret_key];
    if (providerMapping) popupContent += `<h4>Provider: ${providerMapping.name}</h4>`;
    const currentKeyElement = document.getElementById(`current_key_${provider?.secret_key}`); // Use getElementById
    if (currentKeyElement) popupContent += `<p><b>${currentKeyElement.textContent}</b></p>`;
    if (statusCode) {
        popupContent += `<p><b>Status Code:</b> ${statusCode}</p>`;
        if (providerMapping && providerMapping.codes[statusCode]) popupContent += `<p><b>Possible Reason:</b> ${providerMapping.codes[statusCode]}</p>`;
    }
    if (detailedError) {
        popupContent += `<p><b>API Message:</b> ${detailedError.message || 'N/A'}</p>`;
        if (detailedError.type) popupContent += `<p><b>Type:</b> ${detailedError.type}</p>`;
        if (detailedError.code) popupContent += `<p><b>Code:</b> ${detailedError.code}</p>`;
    }
    if (wasKeyRemoved && removedKey) popupContent += `<p style='color: red; font-weight: bold; margin-top: 10px;'>The failing API key (${removedKey}) has been automatically removed from the active set's internal list. Please try generating again.</p>`; // Updated text
    popupContent += `<hr><p><b>Raw Error Message:</b></p><pre style="white-space: pre-wrap; word-wrap: break-word;">${errorMessage}</pre>`;
    popupFunctions.callGenericPopup(popupContent, popupFunctions.POPUP_TYPE.TEXT, "", { large: true, wide: true, allowVerticalScrolling: true });
}

// Initialize the plugin (Placeholder for now)
async function init(loadedSecrets) {
    console.log("MultiProviderKeySwitcher init function called.");
}

// Create a button element - CORRECTED (removed async)
function createButton(title, onClick) {
    const button = document.createElement("div");
    button.classList.add("menu_button", "menu_button_icon", "interactable");
    button.title = title;
    button.onclick = onClick; // The handler CAN be async

    const span = document.createElement("span");
    span.textContent = title;
    button.appendChild(span);

    return button; // Return the DOM Node directly
}

// --- Helper Functions for Set Data ---

// Defines the default structure for a provider's key set data
function getDefaultSetData() {
    return {
        activeSetIndex: 0,
        sets: [{ name: "Default", keys: "" }]
    };
}

// Loads and parses the key set data from secrets
function loadSetData(provider, loadedSecrets) {
    const dataKey = provider.data_secret_key;
    const jsonData = loadedSecrets[dataKey];
    let data;
    if (jsonData) {
        try {
            data = JSON.parse(jsonData);
            if (!data || typeof data.activeSetIndex !== 'number' || !Array.isArray(data.sets)) {
                console.warn(`KeySwitcher: Invalid data structure found for ${provider.name}. Resetting to default.`);
                data = getDefaultSetData();
            }
             if (data.sets.length === 0) {
                 data.sets.push({ name: "Default", keys: "" });
                 data.activeSetIndex = 0;
             }
             if (data.activeSetIndex < 0 || data.activeSetIndex >= data.sets.length) {
                 console.warn(`KeySwitcher: Invalid activeSetIndex (${data.activeSetIndex}) for ${provider.name}. Resetting to 0.`);
                 data.activeSetIndex = 0;
             }
        } catch (error) {
            console.error(`KeySwitcher: Failed to parse key set data for ${provider.name}. Resetting to default. Error:`, error);
            data = getDefaultSetData();
        }
    } else {
        data = getDefaultSetData();
    }
    data.sets = data.sets.map(set => ({
        name: set?.name ?? "Unnamed Set",
        keys: set?.keys ?? ""
    }));
    return data;
}

// Saves the key set data back to secrets
async function saveSetData(provider, data) {
    const dataKey = provider.data_secret_key;
    const jsonData = JSON.stringify(data);
    await secretsFunctions.writeSecret(dataKey, jsonData);
}

// Helper to split keys consistently
function splitKeys(keysString) {
    if (!keysString) return [];
    return keysString.split(/[\n;]/).map(k => k.trim()).filter(k => k.length > 0);
}

// --- End Helper Functions for Set Data ---

// Handle key rotation for the ACTIVE SET of a specific provider
async function handleKeyRotation(providerKey) {
    // Find the provider config using the main secret key
    const provider = Object.values(PROVIDERS).find(p => p.secret_key === providerKey);
    if (!provider) {
        console.error(`KeySwitcher: handleKeyRotation called with unknown providerKey: ${providerKey}`);
        return;
    }

    // Load the current set data for this provider
    const loadedSecrets = await getSecrets();
    if (!loadedSecrets) {
        console.error(`KeySwitcher: Failed to get secrets during rotation for ${provider.name}`);
        return; // Cannot proceed without secrets
    }
    const data = loadSetData(provider, loadedSecrets);

    // Check if switching is enabled (might be redundant if called only when enabled, but good safety check)
    if (!keySwitchingEnabled[provider.secret_key]) {
        console.log(`KeySwitcher: Rotation skipped for ${provider.name}, switching is disabled.`);
        return;
    }

    // Get the active set based on the index in data
    const activeSetIndex = data.activeSetIndex;
    const activeSet = data.sets[activeSetIndex];

    if (!activeSet) {
        console.error(`KeySwitcher: Active set index ${activeSetIndex} invalid for ${provider.name}. Cannot rotate.`);
        return;
    }

    // Get the keys from the active set string
    const keysInActiveSet = splitKeys(activeSet.keys);

    // If 1 or fewer keys in the active set, no rotation is possible/needed
    if (keysInActiveSet.length <= 1) {
        console.log(`KeySwitcher: Rotation skipped for ${provider.name} (Set: ${activeSet.name}). Not enough keys (${keysInActiveSet.length}).`);
        // Ensure the current key is set correctly if there's exactly one key
        if (keysInActiveSet.length === 1) {
             const currentActiveKey = await secretsFunctions.findSecret(provider.secret_key);
             if (currentActiveKey !== keysInActiveSet[0]) {
                 console.log(`KeySwitcher: Setting the single available key for ${provider.name} (Set: ${activeSet.name}) as active.`);
                 await secretsFunctions.writeSecret(provider.secret_key, keysInActiveSet[0]);
                 secrets.secret_state[provider.secret_key] = true; // Update global state
                 secretsFunctions.updateSecretDisplay();
             }
        } else { // Zero keys
            const currentActiveKey = await secretsFunctions.findSecret(provider.secret_key);
            if (currentActiveKey) { // If a key is set but the set is empty, clear it
                console.log(`KeySwitcher: Active set '${activeSet.name}' for ${provider.name} is empty. Clearing active key.`);
                await secretsFunctions.writeSecret(provider.secret_key, "");
                secrets.secret_state[provider.secret_key] = false;
                 secretsFunctions.updateSecretDisplay();
            }
        }
        // Update the info panel regardless, to show current state
        await updateProviderInfoPanel(provider, data);
        return;
    }

    // Find the currently active key in SillyTavern's main secret store
    const currentKey = await secretsFunctions.findSecret(provider.secret_key) || "";
    let newKey = "";

    // Find the index of the current key within the active set's keys
    const currentKeyIndexInSet = keysInActiveSet.indexOf(currentKey);

    if (currentKeyIndexInSet !== -1) {
        // Current key IS in the active set list. Rotate to the next one.
        const nextKeyIndex = (currentKeyIndexInSet + 1) % keysInActiveSet.length; // Wrap around using modulo
        newKey = keysInActiveSet[nextKeyIndex];
    } else {
        // Current key is NOT in the active set list (or it's empty).
        // This could happen if the set was edited, or the key was removed manually, or it's the first load.
        // Default to the first key in the active set.
        console.log(`KeySwitcher: Current key '${currentKey}' not found in active set '${activeSet.name}' for ${provider.name}. Using first key.`);
        newKey = keysInActiveSet[0];
    }

    // Only write the secret and update if the new key is different from the current one
    if (newKey && newKey !== currentKey) {
        console.log(`KeySwitcher: Rotating key for ${provider.name} (Set: ${activeSet.name}). From: '${currentKey || "N/A"}' To: '${newKey}'`);
        await secretsFunctions.writeSecret(provider.secret_key, newKey);

        // Update global secret state and display (like placeholders)
        secrets.secret_state[provider.secret_key] = !!newKey;
        secretsFunctions.updateSecretDisplay();

        // Update our info panel display to show the newly rotated key
        // (We need the latest data, although only the active key actually changed server-side)
        await updateProviderInfoPanel(provider, data);

        // Optionally: Update the main key input field value if visible (helps user see change)
        const mainInput = document.getElementById(provider.input_id);
        if (mainInput) {
            mainInput.value = newKey;
        }
    } else {
         console.log(`KeySwitcher: Rotation check for ${provider.name} (Set: ${activeSet.name}). No change needed. Current key: '${currentKey || "N/A"}'`);
         // Still update panel in case initial load needed it
         await updateProviderInfoPanel(provider, data);
    }
}

/**
 * Handles the removal of a specific key from the currently active set for a provider.
 * Typically called when an API error indicates the key is invalid.
 *
 * @param {object} provider The provider object from PROVIDERS.
 * @param {string} failedKey The API key that failed and should be removed.
 * @returns {Promise<string|null>} The new key activated after removal, or null if no key was removed/no other keys are available.
 */
async function handleKeyRemoval(provider, failedKey) {
    console.log(`KeySwitcher: Attempting removal of key '${failedKey}' for ${provider.name}.`);

    // Load the current set data
    const loadedSecrets = await getSecrets();
    if (!loadedSecrets) {
        console.error(`KeySwitcher: Failed to get secrets during key removal for ${provider.name}. Aborting removal.`);
        return null;
    }
    let data = loadSetData(provider, loadedSecrets); // Use 'let' as we might modify it

    // Find the active set
    const activeSetIndex = data.activeSetIndex;
    const activeSet = data.sets[activeSetIndex];

    if (!activeSet) {
        console.error(`KeySwitcher: Active set index ${activeSetIndex} invalid for ${provider.name}. Cannot remove key.`);
        return null;
    }

    // Get the keys from the active set string and find the index of the failed key
    let keysInActiveSet = splitKeys(activeSet.keys);
    const failedKeyIndex = keysInActiveSet.indexOf(failedKey);

    // If the failed key wasn't found in the active set's list
    if (failedKeyIndex === -1) {
        console.warn(`KeySwitcher: Failed key '${failedKey}' not found in the list of keys for active set '${activeSet.name}' (${provider.name}). Key not removed from storage.`);
        // Optional: Attempt a regular rotation as a fallback, hoping to find a working key?
        // console.log(`KeySwitcher: Performing standard rotation instead.`);
        // await handleKeyRotation(provider.secret_key); // Call the other refactored function
        return null; // Return null because the *specific requested removal* didn't happen
    }

    // --- Key WAS found - Proceed with removal ---
    console.log(`KeySwitcher: Found key '${failedKey}' at index ${failedKeyIndex} in active set '${activeSet.name}'. Removing...`);

    // Remove the key from the array
    keysInActiveSet.splice(failedKeyIndex, 1); // Remove 1 element at failedKeyIndex

    // Update the keys string in the data object
    data.sets[activeSetIndex].keys = keysInActiveSet.join('\n'); // Re-join remaining keys with newline

    // --- Save the updated data structure back to secrets ---
    try {
        await saveSetData(provider, data);
        console.log(`KeySwitcher: Successfully saved updated key list for set '${activeSet.name}' after removing '${failedKey}'.`);
    } catch (error) {
        console.error(`KeySwitcher: Failed to save updated set data for ${provider.name} after key removal. Error:`, error);
        // Decide if we should still proceed with activating a new key or abort
        return null; // Abort if saving failed
    }

    // --- Determine the next key to activate ---
    let newKeyToActivate = null;
    if (keysInActiveSet.length > 0) {
        // If there are keys remaining, activate the one at the same index
        // where the failed key WAS (which is now the next key), wrapping around.
        const nextKeyIndex = failedKeyIndex % keysInActiveSet.length; // Modulo handles wrap-around and index shift after splice
        newKeyToActivate = keysInActiveSet[nextKeyIndex];
        console.log(`KeySwitcher: Activating next key at index ${nextKeyIndex}: '${newKeyToActivate}'`);
    } else {
        // The set is now empty after removing the last key
        newKeyToActivate = ""; // Use empty string to clear the active key
        console.log(`KeySwitcher: Active set '${activeSet.name}' is now empty after removing the last key.`);
    }

    // --- Activate the new key (or clear it) in SillyTavern's main secret ---
    const currentActiveKey = await secretsFunctions.findSecret(provider.secret_key);
    if (currentActiveKey !== newKeyToActivate) {
         await secretsFunctions.writeSecret(provider.secret_key, newKeyToActivate);
         secrets.secret_state[provider.secret_key] = !!newKeyToActivate; // Update global state based on new key
         secretsFunctions.updateSecretDisplay();
         console.log(`KeySwitcher: Updated active key for ${provider.name} to '${newKeyToActivate || "N/A"}'.`);

         // Optionally update the main input field
         const mainInput = document.getElementById(provider.input_id);
         if (mainInput) mainInput.value = newKeyToActivate;

    } else {
        console.log(`KeySwitcher: The key to activate (${newKeyToActivate || "N/A"}) is already the active key. No change needed to main secret.`);
        // Ensure UI reflects potential empty state if key removed was the only one
        secrets.secret_state[provider.secret_key] = !!newKeyToActivate;
        secretsFunctions.updateSecretDisplay();
    }


    // Update our info panel display to reflect the changes
    await updateProviderInfoPanel(provider, data); // Use the modified data object

    // Return the key that was activated
    return newKeyToActivate;
}


// --- Redundant saveKey function (can be removed later) ---
async function saveKey(key, value, updateDisplay = true) {
     console.log("KeySwitcher: saveKey called - likely redundant now:", key);
}

// Get secrets from the server
async function getSecrets() {
    try {
        const response = await fetch("/api/secrets/view", {
            method: "POST",
            headers: scriptFunctions.getRequestHeaders(),
        });
        if (!response.ok) {
            console.error(`KeySwitcher: Failed to fetch secrets, status: ${response.status}`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error("KeySwitcher: Error fetching secrets:", error);
        return null;
    }
}

// --- Info Panel Update Function ---
async function updateProviderInfoPanel(provider, data) {
    const getText = (selectorId) => {
        const element = document.getElementById(selectorId);
        return element ? element.textContent : 'Element not found!';
    };
    const activeSetDiv = document.getElementById(`active_set_info_${provider.secret_key}`);
    if (activeSetDiv) {
        const activeSetName = data.sets[data.activeSetIndex]?.name || "Unknown Set";
        activeSetDiv.textContent = `Active Set: ${activeSetName} (Set #${data.activeSetIndex})`;
    } else console.warn(`KeySwitcher: Could not find activeSetDiv for ${provider.name}`);
    const currentKeyDiv = document.getElementById(`current_key_${provider.secret_key}`);
    if (currentKeyDiv) {
        const currentActiveKeyValue = await secretsFunctions.findSecret(provider.secret_key);
        currentKeyDiv.textContent = `Current Key: ${currentActiveKeyValue ? currentActiveKeyValue : 'N/A'}`; // Simplified N/A message
    } else console.warn(`KeySwitcher: Could not find currentKeyDiv for ${provider.name}`);
    const switchStatusDiv = document.getElementById(`switch_key_${provider.secret_key}`);
    if (switchStatusDiv) {
        switchStatusDiv.textContent = `Switching: ${keySwitchingEnabled[provider.secret_key] ? "On" : "Off"}`;
    } else console.warn(`KeySwitcher: Could not find switchStatusDiv for ${provider.name}`);
    const errorToggleDiv = document.getElementById(`show_${provider.secret_key}_error`);
    if (errorToggleDiv) {
        errorToggleDiv.textContent = `Error Details: ${showErrorDetails[provider.secret_key] ? "On" : "Off"}`;
    } else console.warn(`KeySwitcher: Could not find errorToggleDiv for ${provider.name}`);
}


// --- Main Initialization Logic ---
jQuery(async () => {
    console.log("MultiProviderKeySwitcher: Initializing...");

    // Override toastr.error (handleKeyRotation/Removal calls are still placeholders)
    const originalToastrError = toastr.error;
    toastr.error = async function(...args) {
        originalToastrError(...args);
        console.log("KeySwitcher: Toastr Error Args:", args);
        console.error(...args);
        const [errorMessage, errorTitle] = args;
        for (const provider of Object.values(PROVIDERS)) {
            if (isProviderSource(provider)) {
                console.log(`KeySwitcher: Error occurred while ${provider.name} was active.`);
                let keyRemoved = false;
                let removedKeyValue = null;
                const failedKey = await secretsFunctions.findSecret(provider.secret_key);
                if (failedKey && keySwitchingEnabled[provider.secret_key]) {
                    const statusCodeMatch = errorMessage.match(/\b(\d{3})\b/);
                    let statusCode = null;
                    if (statusCodeMatch) statusCode = parseInt(statusCodeMatch[1], 10);
                    const isRemovalStatusCode = REMOVAL_STATUS_CODES.includes(statusCode);
                    const isRemovalMessage = REMOVAL_MESSAGE_REGEX.test(errorMessage);
                    if (isRemovalStatusCode || isRemovalMessage) {
                        console.log(`KeySwitcher: Removal trigger matched for ${provider.name}. Attempting removal...`);
                        // !!! handleKeyRemoval needs refactoring before this works !!!
                        const newKey = await handleKeyRemoval(provider, failedKey); // Returns null for now
                        if (newKey !== null) { // This check won't pass until handleKeyRemoval is fixed
                             keyRemoved = true;
                             removedKeyValue = failedKey;
                             console.log(`KeySwitcher: Key ${failedKey} supposedly removed, new key is ${newKey}`);
                        } else {
                            console.log(`KeySwitcher: handleKeyRemoval returned null (or failed), key ${failedKey} not removed.`);
                        }
                    } else {
                        console.log(`KeySwitcher: Error for ${provider.name} (Switching ON) did not match removal triggers. Rotating...`);
                        // !!! handleKeyRotation needs refactoring before this works !!!
                        await handleKeyRotation(provider.secret_key);
                    }
                } else if (failedKey) {
                    console.log(`KeySwitcher: Error for ${provider.name} occurred, but Key Switching is OFF.`);
                } else {
                    console.log(`KeySwitcher: Error for ${provider.name} occurred, but no failed key found in secret.`);
                }
                if (showErrorDetails[provider.secret_key]) {
                     showErrorPopup(provider, errorMessage, errorTitle || `${provider.name} API Error`, keyRemoved, removedKeyValue);
                }
                 break;
            }
        }
    };

    // Get initial secrets
    const loadedSecrets = await getSecrets();
    if (!loadedSecrets) {
        console.error("KeySwitcher: Failed to load secrets on initial load. UI setup aborted.");
        toastr.error("KeySwitcher: Failed to load secrets. Key management UI disabled.", "Initialization Error");
        return;
    }
    await init(loadedSecrets);

    // Process each provider - Setup UI
    for (const provider of Object.values(PROVIDERS)) {
        console.log(`KeySwitcher: Processing provider UI for: ${provider.name}`);
        const formElement = provider.get_form();
        console.log(`KeySwitcher: >>> Result of get_form() for ${provider.name}:`, formElement);

        if (formElement) {
            // Check if UI already injected (simple check for our main container)
            if (formElement.querySelector(`#keyswitcher-main-${provider.secret_key}`)) {
                console.log(`KeySwitcher: UI already exists for ${provider.name}. Skipping injection.`);
                 // Optionally, force an update if needed (though redrawProviderUI will handle this later)
                 try {
                     const data = loadSetData(provider, loadedSecrets);
                     await updateProviderInfoPanel(provider, data);
                 } catch (updateError) {
                     console.error(`KeySwitcher: Error updating existing UI panel for ${provider.name}`, updateError);
                 }
                continue;
            }

            // --- Try/Catch around UI creation and injection ---
            try {
                const data = loadSetData(provider, loadedSecrets);
                console.log(`KeySwitcher: ${provider.name} initial set data:`, JSON.parse(JSON.stringify(data)));

                // --- Create Main Container ---
                const topLevelContainer = document.createElement("div");
                topLevelContainer.id = `keyswitcher-main-${provider.secret_key}`; // Added ID here
                topLevelContainer.classList.add("keyswitcher-provider-container");
                topLevelContainer.style.marginTop = "15px";
                topLevelContainer.style.border = "1px solid #444";
                topLevelContainer.style.padding = "10px";
                topLevelContainer.style.borderRadius = "5px";

                // --- Heading ---
                const heading = document.createElement("h4");
                heading.textContent = `${provider.name} - Key Set Manager`;
                heading.style.marginTop = "0px";
                heading.style.marginBottom = "10px";
                topLevelContainer.appendChild(heading);

                // --- Info Panel (with placeholders) ---
                const infoPanel = document.createElement("div");
                infoPanel.id = `keyswitcher-info-${provider.secret_key}`;
                infoPanel.style.marginBottom = "10px";
                infoPanel.style.padding = "8px";
                infoPanel.style.border = "1px dashed #666";
                infoPanel.style.borderRadius = "4px";
                const activeSetDiv = document.createElement("div"); activeSetDiv.id = `active_set_info_${provider.secret_key}`; activeSetDiv.textContent = "Active Set: Loading..."; infoPanel.appendChild(activeSetDiv);
                const currentKeyDiv = document.createElement("div"); currentKeyDiv.id = `current_key_${provider.secret_key}`; currentKeyDiv.textContent = "Current Key: Loading..."; infoPanel.appendChild(currentKeyDiv);
                const switchStatusDiv = document.createElement("div"); switchStatusDiv.id = `switch_key_${provider.secret_key}`; switchStatusDiv.textContent = "Switching: Loading..."; infoPanel.appendChild(switchStatusDiv);
                const errorToggleDiv = document.createElement("div"); errorToggleDiv.id = `show_${provider.secret_key}_error`; errorToggleDiv.textContent = "Error Details: Loading..."; infoPanel.appendChild(errorToggleDiv);
                topLevelContainer.appendChild(infoPanel);

                // --- Global Button Container ---
                const globalButtonContainer = document.createElement("div");
                globalButtonContainer.classList.add("key-switcher-buttons", "flex-container", "flex");
                globalButtonContainer.style.marginBottom = "10px";
                globalButtonContainer.style.gap = "5px";

                // --- Create Global Buttons (using corrected createButton) ---
                const keySwitchingButton = createButton("Toggle Auto Switching/Removal", async () => {
                    keySwitchingEnabled[provider.secret_key] = !keySwitchingEnabled[provider.secret_key];
                    localStorage.setItem(`switch_key_${provider.secret_key}`, keySwitchingEnabled[provider.secret_key].toString());
                    const currentSecrets = await getSecrets() || {}; // Ensure fresh secrets/data for update
                    await updateProviderInfoPanel(provider, loadSetData(provider, currentSecrets));
                });
                const rotateManuallyButton = createButton("Rotate Key in Active Set Now", async () => {
                    console.log(`KeySwitcher: Manual rotation requested for ${provider.name}`);
                     // !!! handleKeyRotation needs refactoring !!!
                    await handleKeyRotation(provider.secret_key);
                    const currentSecrets = await getSecrets() || {};
                    await updateProviderInfoPanel(provider, loadSetData(provider, currentSecrets)); // Update panel after attempt
                });
                const errorToggleButton = createButton("Toggle Error Details Popup", async () => {
                    showErrorDetails[provider.secret_key] = !showErrorDetails[provider.secret_key];
                    localStorage.setItem(`show_${provider.secret_key}_error`, showErrorDetails[provider.secret_key].toString());
                    const currentSecrets = await getSecrets() || {};
                    await updateProviderInfoPanel(provider, loadSetData(provider, currentSecrets));
                });

                globalButtonContainer.appendChild(keySwitchingButton);
                globalButtonContainer.appendChild(rotateManuallyButton);
                globalButtonContainer.appendChild(errorToggleButton);
                topLevelContainer.appendChild(globalButtonContainer);

                // --- Dynamic Sets Container (Placeholder) ---
                const dynamicSetsContainer = document.createElement("div");
                dynamicSetsContainer.id = `keyswitcher-sets-dynamic-${provider.secret_key}`;
                topLevelContainer.appendChild(dynamicSetsContainer);

                // --- Inject UI ---
                console.log(`KeySwitcher: Attempting to inject UI for ${provider.name}`);
                const insertBeforeElement = formElement.querySelector('hr:not(.key-switcher-hr), button, .form_section_block'); // Try to avoid inserting before our own hr
                const separatorHr = document.createElement("hr");
                separatorHr.className = "key-switcher-hr"; // Add class to potentially ignore later

                if (insertBeforeElement) {
                    formElement.insertBefore(separatorHr, insertBeforeElement);
                    formElement.insertBefore(topLevelContainer, insertBeforeElement); // Insert container BEFORE found element
                } else {
                    console.log(`KeySwitcher: No specific insert point found for ${provider.name}, appending.`);
                    formElement.appendChild(separatorHr);
                    formElement.appendChild(topLevelContainer);
                }
                console.log(`KeySwitcher: UI Injected successfully for ${provider.name}`);

                // --- Call initial Info Panel update ---
                await updateProviderInfoPanel(provider, data);

                // --- Call placeholder for dynamic UI draw (to be implemented next) ---
                // await redrawProviderUI(provider, data); // <- Will add this call later


            } catch (injectionError) {
                 console.error(`KeySwitcher: *** ERROR during UI creation/injection for ${provider.name}:`, injectionError);
                 console.error(`KeySwitcher: formElement at time of error was:`, formElement);
            }
            // --- End Try/Catch ---

        } else {
             console.warn(`KeySwitcher: Could not find form element for ${provider.name} (ID: ${provider.form_id}). Skipping UI injection.`);
        }
    } // --- End of provider loop ---

    // --- Event Listeners (Keep as is, rotation calls are placeholders) ---
    scriptFunctions.eventSource.on(scriptFunctions.event_types.CHATCOMPLETION_MODEL_CHANGED, async (model) => { /* ...unchanged... */ });
    scriptFunctions.eventSource.on(scriptFunctions.event_types.CHAT_COMPLETION_SETTINGS_READY, async () => {
        console.log("KeySwitcher: Chat completion settings ready, checking for initial key rotation...");
        try {
            const currentSource = oaiFunctions.oai_settings.chat_completion_source;
            for (const provider of Object.values(PROVIDERS)) {
                if (isProviderSource(provider)) {
                    if (keySwitchingEnabled[provider.secret_key]) {
                        console.log(`KeySwitcher: Provider ${provider.name} is active and switching is enabled. Attempting initial key rotation.`);
                        // !!! handleKeyRotation needs refactoring !!!
                        await handleKeyRotation(provider.secret_key);
                        // Optionally update panel after rotation attempt
                        const currentSecrets = await getSecrets() || {};
                        await updateProviderInfoPanel(provider, loadSetData(provider, currentSecrets));
                    } else {
                         console.log(`KeySwitcher: Provider ${provider.name} is active but switching is disabled.`);
                    }
                    break; // Found active provider
                }
            }
        } catch(e) {
            console.error("KeySwitcher: Error during SETTINGS_READY rotation check:", e);
        }
    });

    console.log("MultiProviderKeySwitcher: Initialization complete.");
});


// Export the plugin's init function - CORRECTED
export default init;
