// @ts-nocheck
import * as script from "../../../../../script.js";
import * as secrets from "../../../../../scripts/secrets.js";
import * as oai from "../../../../../scripts/openai.js";
import * as popup from "../../../../../scripts/popup.js";
import { SECRET_KEYS } from "../../../../../scripts/secrets.js";

// ... (Keep the webpack wrapper stuff if it was there) ...

// Import functions (keep as they were)
const scriptFunctions = { /* ... */ };
const secretsFunctions = { /* ... */ };
const oaiFunctions = { /* ... */ };
const popupFunctions = { /* ... */ };

// Helper function to create the name for the secret storing set data
function getProviderDataSecretKey(baseSecretKey) {
    return `${baseSecretKey}_key_sets_data`; // e.g., api_key_openai_key_sets_data
}


// Provider sources and keys - MODIFIED
const PROVIDERS = {
    OPENROUTER: {
        name: "OpenRouter",
        source_check: () => ["openrouter"].includes(oaiFunctions.oai_settings.chat_completion_source),
        secret_key: SECRET_KEYS.OPENROUTER,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.OPENROUTER), // ADDED
        // custom_key: "api_key_openrouter_custom", // REMOVED
        form_id: "openrouter_form",
        input_id: "api_key_openrouter",
        get_form: () => document.getElementById("openrouter_form"), // Use getElementById for safety
    },
    ANTHROPIC: {
        name: "Anthropic (Claude)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'claude',
        secret_key: SECRET_KEYS.CLAUDE,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.CLAUDE), // ADDED
        // custom_key: "api_key_claude_custom", // REMOVED
        form_id: "claude_form",
        input_id: "api_key_claude",
        get_form: () => document.getElementById("claude_form"),
    },
    OPENAI: {
        name: "OpenAI",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'openai',
        secret_key: SECRET_KEYS.OPENAI,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.OPENAI), // ADDED
        // custom_key: "api_key_openai_custom", // REMOVED
        form_id: "openai_form",
        input_id: "api_key_openai",
        get_form: () => document.getElementById("openai_form"),
    },
    GEMINI: {
        name: "Google AI Studio (Gemini)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'google',
        secret_key: SECRET_KEYS.MAKERSUITE,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.MAKERSUITE), // ADDED
        // custom_key: "api_key_makersuite_custom", // REMOVED
        form_id: "makersuite_form",
        input_id: "api_key_makersuite",
        get_form: () => document.getElementById("makersuite_form"),
    },
    DEEPSEEK: {
        name: "DeepSeek",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'deepseek',
        secret_key: SECRET_KEYS.DEEPSEEK,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.DEEPSEEK), // ADDED
        // custom_key: "api_key_deepseek_custom", // REMOVED
        form_id: "deepseek_form",
        input_id: "api_key_deepseek",
        get_form: () => document.getElementById("deepseek_form"),
    },
    XAI: {
        name: "Xai (Grok)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'xai',
        secret_key: SECRET_KEYS.XAI,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.XAI), // ADDED
        // custom_key: "api_key_xai_custom", // REMOVED
        form_id: "xai_form",
        input_id: "api_key_xai",
        get_form: () => document.getElementById("xai_form"),
    }
};

// ... (Keep PROVIDER_ERROR_MAPPINGS, REMOVAL_STATUS_CODES, REMOVAL_MESSAGE_REGEX) ...
const PROVIDER_ERROR_MAPPINGS = { /* ...unchanged... */ };
const REMOVAL_STATUS_CODES = [400, 401, 403, 404, 429];
const REMOVAL_MESSAGE_REGEX = /Unauthorized|Forbidden|Permission|Invalid|Exceeded|Internal/i;

// ... (Keep isProviderSource) ...
const isProviderSource = (provider) => provider.source_check();

// ... (Keep keySwitchingEnabled, showErrorDetails, and their initialization) ...
let keySwitchingEnabled = {};
let showErrorDetails = {};
Object.values(PROVIDERS).forEach(provider => {
    keySwitchingEnabled[provider.secret_key] = localStorage.getItem(`switch_key_${provider.secret_key}`) === "true";
    showErrorDetails[provider.secret_key] = localStorage.getItem(`show_${provider.secret_key}_error`) !== "false";
});

// ... (Keep showErrorPopup function for now, might need slight adjustments later) ...
function showErrorPopup(provider, errorMessage, errorTitle = "API Error", wasKeyRemoved = false, removedKey = null) {
    // ... unchanged for now ...
}

// ... (Keep init function for now) ...
async function init(loadedSecrets) {
    // ... unchanged for now ...
}

// ... (Keep createButton function) ...
async function createButton(title, onClick) {
    // ... unchanged ...
}

// --- Helper Functions for Set Data --- ADDED ---

// Defines the default structure for a provider's key set data
function getDefaultSetData() {
    return {
        activeSetIndex: 0, // Index of the currently active set
        sets: [
            { name: "Default", keys: "" } // Start with one default set
        ]
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
            // Basic validation: ensure structure looks right
            if (!data || typeof data.activeSetIndex !== 'number' || !Array.isArray(data.sets)) {
                console.warn(`KeySwitcher: Invalid data structure found for ${provider.name}. Resetting to default.`);
                data = getDefaultSetData();
            }
             // Ensure at least one set exists
             if (data.sets.length === 0) {
                 data.sets.push({ name: "Default", keys: "" });
                 data.activeSetIndex = 0;
             }
             // Ensure activeSetIndex is valid
             if (data.activeSetIndex < 0 || data.activeSetIndex >= data.sets.length) {
                 console.warn(`KeySwitcher: Invalid activeSetIndex (${data.activeSetIndex}) for ${provider.name}. Resetting to 0.`);
                 data.activeSetIndex = 0;
             }

        } catch (error) {
            console.error(`KeySwitcher: Failed to parse key set data for ${provider.name}. Resetting to default. Error:`, error);
            data = getDefaultSetData();
        }
    } else {
        // No data found, use default
        data = getDefaultSetData();
    }
    // Ensure every set has name and keys properties
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
    // No need to call saveSettingsDebounced here usually, writeSecret handles it? Check ST source if needed.
}

// Helper to split keys consistently
function splitKeys(keysString) {
    if (!keysString) return [];
    return keysString.split(/[\n;]/).map(k => k.trim()).filter(k => k.length > 0);
}


// --- End Helper Functions for Set Data ---


// ... (Keep handleKeyRotation and handleKeyRemoval for now - WILL NEED MAJOR CHANGES LATER) ...
async function handleKeyRotation(providerKey) {
    console.warn("KeySwitcher: handleKeyRotation needs refactoring for set data!"); // Placeholder warning
    // TODO: Refactor this function in a later step
}
async function handleKeyRemoval(provider, failedKey) {
    console.warn("KeySwitcher: handleKeyRemoval needs refactoring for set data!"); // Placeholder warning
    // TODO: Refactor this function in a later step
    return null; // Return null until refactored
}


// ... (Keep saveKey, but it's now less relevant - saveSetData is the primary save) ...
async function saveKey(key, value, updateDisplay = true) {
     console.log("KeySwitcher: saveKey called, may be redundant now:", key);
    // await secretsFunctions.writeSecret(key, value);
    // if (updateDisplay) {
    //     secretsFunctions.updateSecretDisplay();
    // }
    // scriptFunctions.saveSettingsDebounced();
}


// ... (Keep getSecrets function) ...
async function getSecrets() {
    // ... unchanged ...
}

// NEW Function: Updates the static info panel for a provider
async function updateProviderInfoPanel(provider, data) {
    // Helper function to safely get text content or a default
    const getText = (selectorId) => {
        const element = document.getElementById(selectorId);
        return element ? element.textContent : 'Element not found!';
    };

    // Update Active Set Info
    const activeSetDiv = document.getElementById(`active_set_info_${provider.secret_key}`);
    if (activeSetDiv) {
        const activeSetName = data.sets[data.activeSetIndex]?.name || "Unknown Set";
        activeSetDiv.textContent = `Active Set: ${activeSetName} (Set #${data.activeSetIndex})`;
    } else {
        console.warn(`KeySwitcher: Could not find activeSetDiv for ${provider.name}`);
    }

    // Update Current Key Info (Fetch the actual active key from secrets)
    const currentKeyDiv = document.getElementById(`current_key_${provider.secret_key}`);
    if (currentKeyDiv) {
        const currentActiveKeyValue = await secretsFunctions.findSecret(provider.secret_key);
        currentKeyDiv.textContent = `Current Key: ${currentActiveKeyValue ? currentActiveKeyValue : 'N/A (Set may be empty or key not set)'}`;
    } else {
        console.warn(`KeySwitcher: Could not find currentKeyDiv for ${provider.name}`);
    }

    // Update Switching Status Info
    const switchStatusDiv = document.getElementById(`switch_key_${provider.secret_key}`);
    if (switchStatusDiv) {
        switchStatusDiv.textContent = `Switching: ${keySwitchingEnabled[provider.secret_key] ? "On" : "Off"}`;
    } else {
        console.warn(`KeySwitcher: Could not find switchStatusDiv for ${provider.name}`);
    }

    // Update Error Details Toggle Info
    const errorToggleDiv = document.getElementById(`show_${provider.secret_key}_error`);
    if (errorToggleDiv) {
        errorToggleDiv.textContent = `Error Details: ${showErrorDetails[provider.secret_key] ? "On" : "Off"}`;
    } else {
        console.warn(`KeySwitcher: Could not find errorToggleDiv for ${provider.name}`);
    }

    // Optional: Log the update
    // console.log(`KeySwitcher: Updated info panel for ${provider.name}. Active Set: ${getText(`active_set_info_${provider.secret_key}`)}, Current Key: ${getText(`current_key_${provider.secret_key}`)}`);
}

// jQuery ready function
jQuery(async () => {
    // ... (Keep console.log, toastr.error override) ...

    // Get secrets
    const loadedSecrets = await getSecrets() || {};
    await init(loadedSecrets);

    // Process each provider
    for (const provider of Object.values(PROVIDERS)) {
        // ... (Keep processing log, get_form, form check) ...

        if (formElement) {
            const data = loadSetData(provider, loadedSecrets);
            console.log(`${provider.name} initial set data:`, JSON.parse(JSON.stringify(data)));

            // --- Create UI elements (topLevelContainer, heading, infoPanel placeholders, globalButtonContainer) ---
            // ... (Keep this element creation part as it was in Step 1) ...

            const topLevelContainer = document.createElement("div"); /* ... setup ... */
            const heading = document.createElement("h4"); /* ... setup ... */
            topLevelContainer.appendChild(heading);

            // Info panel - PLACEHOLDERS INSIDE
            const infoPanel = document.createElement("div"); /* ... setup ... */
            infoPanel.id = `keyswitcher-info-${provider.secret_key}`;
             const activeSetDiv = document.createElement("div"); activeSetDiv.id = `active_set_info_${provider.secret_key}`; activeSetDiv.textContent = "Active Set: Loading...";
             const currentKeyDiv = document.createElement("div"); currentKeyDiv.id = `current_key_${provider.secret_key}`; currentKeyDiv.textContent = "Current Key: Loading...";
             const switchStatusDiv = document.createElement("div"); switchStatusDiv.id = `switch_key_${provider.secret_key}`; switchStatusDiv.textContent = "Switching: Loading..."; // Updated placeholder
             const errorToggleDiv = document.createElement("div"); errorToggleDiv.id = `show_${provider.secret_key}_error`; errorToggleDiv.textContent = "Error Details: Loading..."; // Updated placeholder
             infoPanel.appendChild(activeSetDiv);
             infoPanel.appendChild(currentKeyDiv);
             infoPanel.appendChild(switchStatusDiv);
             infoPanel.appendChild(errorToggleDiv);
            topLevelContainer.appendChild(infoPanel);

            // Global Button container
            const globalButtonContainer = document.createElement("div"); /* ... setup ... */

            // --- Update GLOBAL buttons ---
            const keySwitchingButton = await createButton("Toggle Auto Switching/Removal", async () => {
                keySwitchingEnabled[provider.secret_key] = !keySwitchingEnabled[provider.secret_key];
                localStorage.setItem(`switch_key_${provider.secret_key}`, keySwitchingEnabled[provider.secret_key].toString());
                // Call the update function HERE
                await updateProviderInfoPanel(provider, loadSetData(provider, await getSecrets())); // Reload data in case sets changed elsewhere
            });

            const rotateManuallyButton = await createButton("Rotate Key in Active Set Now", async () => {
                 console.log(`Manual rotation requested for ${provider.name}`);
                 // !!! Call WILL need updating after handleKeyRotation refactor !!!
                 await handleKeyRotation(provider.secret_key);
                 // Update panel after rotation attempt (even if it fails for now)
                 await updateProviderInfoPanel(provider, loadSetData(provider, await getSecrets()));
             });

             const errorToggleButton = await createButton("Toggle Error Details Popup", async () => {
                 showErrorDetails[provider.secret_key] = !showErrorDetails[provider.secret_key];
                 localStorage.setItem(`show_${provider.secret_key}_error`, showErrorDetails[provider.secret_key].toString());
                  // Call the update function HERE
                 await updateProviderInfoPanel(provider, loadSetData(provider, await getSecrets()));
             });

            globalButtonContainer.appendChild(keySwitchingButton);
            globalButtonContainer.appendChild(rotateManuallyButton);
            globalButtonContainer.appendChild(errorToggleButton);
            topLevelContainer.appendChild(globalButtonContainer);

            // Dynamic Sets Container (placeholder)
            const dynamicSetsContainer = document.createElement("div"); /* ... setup ... */
            dynamicSetsContainer.id = `keyswitcher-sets-dynamic-${provider.secret_key}`;
            topLevelContainer.appendChild(dynamicSetsContainer);

            // --- Inject UI ---
            // ... (Keep injection logic the same) ...
            const insertBeforeElement = formElement.querySelector('hr, button, .form_section_block');
            const separatorHr = document.createElement("hr");
            if (insertBeforeElement) {
                formElement.insertBefore(separatorHr, insertBeforeElement);
                formElement.insertBefore(topLevelContainer, separatorHr.nextSibling);
            } else {
                formElement.appendChild(document.createElement("hr"));
                formElement.appendChild(topLevelContainer);
            }

            // --- Call initial update/draw functions --- ADDED / MODIFIED ---
            await updateProviderInfoPanel(provider, data); // Call initial info panel update
            // await redrawProviderUI(provider, data); // This will be created later to draw the actual set list UI

        } else {
             // ... (Keep warning log) ...
        }
    } // End of provider loop

    // --- Event Listeners ---
    // ... (Keep model changed listener) ...
    // ... (Keep SETTINGS_READY listener - handleKeyRotation call still needs update) ...

    console.log("MultiProviderKeySwitcher: Initialization complete.");
});

// ... (Keep export default exports.default;) ...


// Export the plugin's init function
export default exports.default;
