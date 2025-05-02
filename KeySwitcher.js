// @ts-nocheck
import * as script from "../../../../../script.js";
import * as secrets from "../../../../../scripts/secrets.js";
import * as oai from "../../../../../scripts/openai.js";
import * as popup from "../../../../../scripts/popup.js";
import { SECRET_KEYS } from "../../../../../scripts/secrets.js";

// Module wrapper (unchanged)
var __webpack_module_cache__ = {};
function __webpack_require__(moduleId) { /* ...unchanged... */ }
var __webpack_modules__ = {};
__webpack_modules__.d = (exports, definition) => { /* ...unchanged... */ };
__webpack_modules__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop));

const exports = {};
__webpack_modules__.d(exports, { default: () => init });

// Import functions (unchanged)
const scriptFunctions = { /* ...unchanged... */ };
const secretsFunctions = { /* ...unchanged... */ };
const oaiFunctions = { /* ...unchanged... */ };
const popupFunctions = { /* ...unchanged... */ };

// --- NEW: Central secret key name generator ---
function getProviderDataSecretKey(baseSecretKey) {
    return `${baseSecretKey}_key_sets_data`;
}

// --- Updated PROVIDERS definition ---
const PROVIDERS = {
    OPENROUTER: {
        name: "OpenRouter",
        source_check: () => ["openrouter"].includes(oaiFunctions.oai_settings.chat_completion_source),
        secret_key: SECRET_KEYS.OPENROUTER, // The main secret key ST uses
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.OPENROUTER), // Secret storing our JSON
        form_id: "openrouter_form",
        input_id: "api_key_openrouter",
        get_form: () => $("#openrouter_form")[0],
    },
    ANTHROPIC: {
        name: "Anthropic (Claude)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'claude',
        secret_key: SECRET_KEYS.CLAUDE,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.CLAUDE),
        form_id: "claude_form",
        input_id: "api_key_claude",
        get_form: () => $("#claude_form")[0],
    },
    OPENAI: {
        name: "OpenAI",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'openai',
        secret_key: SECRET_KEYS.OPENAI,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.OPENAI),
        form_id: "openai_form",
        input_id: "api_key_openai",
        get_form: () => $("#openai_form")[0],
    },
    GEMINI: {
        name: "Google AI Studio (Gemini)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'google',
        secret_key: SECRET_KEYS.MAKERSUITE,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.MAKERSUITE),
        form_id: "makersuite_form",
        input_id: "api_key_makersuite",
        get_form: () => $("#makersuite_form")[0],
    },
    DEEPSEEK: {
        name: "DeepSeek",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'deepseek',
        secret_key: SECRET_KEYS.DEEPSEEK,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.DEEPSEEK),
        form_id: "deepseek_form",
        input_id: "api_key_deepseek",
        get_form: () => $("#deepseek_form")[0],
    },
    XAI: {
        name: "Xai (Grok)",
        source_check: () => oaiFunctions.oai_settings.chat_completion_source === 'xai',
        secret_key: SECRET_KEYS.XAI,
        data_secret_key: getProviderDataSecretKey(SECRET_KEYS.XAI),
        form_id: "xai_form",
        input_id: "api_key_xai",
        get_form: () => $("#xai_form")[0],
    }
};

// Provider-specific error details (unchanged)
const PROVIDER_ERROR_MAPPINGS = { /* ...unchanged... */ };

// Removal Triggers (unchanged)
const REMOVAL_STATUS_CODES = [400, 401, 403, 404, 429];
const REMOVAL_MESSAGE_REGEX = /Unauthorized|Forbidden|Permission|Invalid|Exceeded|Internal/i;

// Check if current source matches a provider (unchanged)
const isProviderSource = (provider) => provider.source_check();

// Global toggles state - Per provider base secret key
let keySwitchingEnabled = {};
let showErrorDetails = {};

// Initialize global toggles from localStorage (using unique keys for dynamic version)
Object.values(PROVIDERS).forEach(provider => {
    keySwitchingEnabled[provider.secret_key] = localStorage.getItem(`switch_key_${provider.secret_key}_dynamic`) === "true"; // <-- Added suffix
    showErrorDetails[provider.secret_key] = localStorage.getItem(`show_${provider.secret_key}_error_dynamic`) !== "false"; // <-- Added suffix
});

// Show error information popup (unchanged logic, but context might adapt)
function showErrorPopup(provider, errorMessage, errorTitle = "API Error", wasKeyRemoved = false, removedKey = null) {
    // Find the set data to potentially display the active set name/index
    // This function doesn't *need* the set data currently, but could be enhanced
    let popupContent = `<h3>${errorTitle}</h3>`;
    // ... (rest of the unchanged popup logic) ...
     const providerMapping = PROVIDER_ERROR_MAPPINGS[provider?.secret_key];
     if (providerMapping) { popupContent += `<h4>Provider: ${providerMapping.name}</h4>`; }
     const currentKeyElement = $(`#current_key_${provider?.secret_key}`)[0]; // Still useful
     if (currentKeyElement) { popupContent += `<p><b>${currentKeyElement.textContent}</b></p>`; }
     // ... status code, detailed error, etc. (unchanged) ...
    if (wasKeyRemoved && removedKey) {
        popupContent += `<p style='color: red; font-weight: bold; margin-top: 10px;'>The failing API key (${removedKey}) has been automatically removed from its set. Please check your sets and try generating again.</p>`;
    }
     popupContent += `<hr><p><b>Raw Error Message:</b></p>
                      <pre style="white-space: pre-wrap; word-wrap: break-word;">${errorMessage}</pre>`;
     popupFunctions.callGenericPopup(popupContent, popupFunctions.POPUP_TYPE.TEXT, "", { large: true, wide: true, allowVerticalScrolling: true });
}

// --- Get secrets (unchanged) ---
async function getSecrets() { /* ...unchanged... */ }

// --- Save a key to secrets (unchanged) ---
async function saveKey(key, value, updateDisplay = true) { /* ...unchanged... */ }

// --- NEW: Default structure for set data ---
function getDefaultSetData() {
    return {
        activeSetIndex: 0,
        sets: [
            { name: "Default Set 1", keys: "" } // Start with one empty set
        ]
    };
}

// --- NEW: Load Set Data for a Provider ---
async function loadSetData(provider, loadedSecrets) {
    const jsonData = loadedSecrets[provider.data_secret_key];
    if (!jsonData) {
        return getDefaultSetData();
    }
    try {
        const data = JSON.parse(jsonData);
        // Basic validation/migration
        if (!data.hasOwnProperty('activeSetIndex') || !Array.isArray(data.sets)) {
            console.warn(`Invalid set data format for ${provider.name}. Resetting to default.`);
            return getDefaultSetData();
        }
        // Ensure activeSetIndex is valid
        if (data.activeSetIndex < 0 || data.activeSetIndex >= data.sets.length) {
            data.activeSetIndex = 0; // Default to first set if index is out of bounds
        }
        // Ensure at least one set exists
        if (data.sets.length === 0) {
            console.warn(`No sets found for ${provider.name}. Adding default set.`);
            data.sets.push({ name: "Default Set 1", keys: "" });
            data.activeSetIndex = 0;
        }
        return data;
    } catch (e) {
        console.error(`Error parsing set data JSON for ${provider.name}:`, e);
        return getDefaultSetData(); // Return default on error
    }
}

// --- NEW: Save Set Data for a Provider ---
async function saveSetData(provider, data) {
    // Ensure data integrity before saving
    if (!data || !Array.isArray(data.sets) || typeof data.activeSetIndex !== 'number') {
        console.error(`Attempted to save invalid set data structure for ${provider.name}. Aborting save.`);
        return;
    }
     // Make sure activeSetIndex is valid, clamp if necessary
     if (data.sets.length === 0) { data.activeSetIndex = -1; } // No active set if empty
     else { data.activeSetIndex = Math.max(0, Math.min(data.activeSetIndex, data.sets.length - 1)); }

    const jsonString = JSON.stringify(data);
    await saveKey(provider.data_secret_key, jsonString, false); // Don't trigger global display update just for this
     console.log(`Saved set data for ${provider.name}`);
}

// --- NEW: Get Keys String from Active Set ---
function getActiveKeysString(data) {
    if (!data || data.sets.length === 0 || data.activeSetIndex < 0 || data.activeSetIndex >= data.sets.length) {
        return ""; // No valid active set or no sets
    }
    return data.sets[data.activeSetIndex].keys || "";
}

// --- NEW: Split keys string into array ---
function splitKeys(keysString) {
    return (keysString || "")
        .split(/[\n;]/)
        .map(k => k.trim())
        .filter(k => k.length > 0);
}

// --- Update Info Panel ---
async function updateProviderInfoPanel(provider, data) {
    const activeSetIndex = data.activeSetIndex;
    const activeSetName = (activeSetIndex >= 0 && activeSetIndex < data.sets.length)
        ? data.sets[activeSetIndex].name : "N/A";
    const currentKey = await secretsFunctions.findSecret(provider.secret_key) || "N/A";
    const activeKeysArray = splitKeys(getActiveKeysString(data));

    // Find the last rotated key within the *active* set if possible
    let lastRotatedKey = "N/A";
     if (activeKeysArray.length > 1 && activeKeysArray.includes(currentKey)) {
        const currentIndex = activeKeysArray.indexOf(currentKey);
        lastRotatedKey = activeKeysArray[(currentIndex - 1 + activeKeysArray.length) % activeKeysArray.length];
    } else if (activeKeysArray.length > 0 && !activeKeysArray.includes(currentKey)) {
         lastRotatedKey = "N/A (Current key not in active set)";
    } else if (activeKeysArray.length <= 1) {
         lastRotatedKey = "N/A (Single/No key in set)";
    }

    // Get UI elements
    const activeSetElement = $(`#active_set_info_${provider.secret_key}`)[0];
    const currentKeyElement = $(`#current_key_${provider.secret_key}`)[0];
    const lastKeyElement = $(`#last_key_${provider.secret_key}`)[0];
    const switchStatusElement = $(`#switch_key_${provider.secret_key}`)[0];
    const errorToggleElement = $(`#show_${provider.secret_key}_error`)[0];

    // Update text content
    if (activeSetElement) activeSetElement.textContent = `Active Set: ${activeSetName} (Index ${activeSetIndex >= 0 ? activeSetIndex : 'N/A'})`;
    if (currentKeyElement) currentKeyElement.textContent = `Current API Key: ${currentKey}`;
     if (lastKeyElement) lastKeyElement.textContent = `Prev. Rotated (in set): ${lastRotatedKey}`;
    if (switchStatusElement) switchStatusElement.textContent = `Auto Switching/Removal: ${keySwitchingEnabled[provider.secret_key] ? "On" : "Off"}`;
    if (errorToggleElement) errorToggleElement.textContent = `Show Error Details: ${showErrorDetails[provider.secret_key] ? "On" : "Off"}`;

    // Update main input field potentially
    const mainInput = $(`#${provider.input_id}`)[0];
    if (mainInput && mainInput.value !== currentKey) {
        mainInput.value = currentKey;
    }

    // Update global secret state and display
    secrets.secret_state[provider.secret_key] = !!currentKey && currentKey !== "N/A";
    secretsFunctions.updateSecretDisplay();
}


// Handle key rotation (Updated for dynamic sets)
async function handleKeyRotation(providerKey) {
    const provider = Object.values(PROVIDERS).find(p => p.secret_key === providerKey);
    if (!provider) return;

    const loadedSecrets = await getSecrets();
    if (!loadedSecrets) return;
    if (!keySwitchingEnabled[provider.secret_key]) return; // Check global toggle

    const data = await loadSetData(provider, loadedSecrets);
    if (data.sets.length === 0 || data.activeSetIndex < 0) {
        console.log(`${provider.name}: Rotation skipped, no active set.`);
        return;
    }

    const activeSetIndex = data.activeSetIndex;
    const activeKeys = splitKeys(data.sets[activeSetIndex].keys);

    if (activeKeys.length <= 1) {
        console.log(`${provider.name} (Set ${activeSetIndex}): Rotation skipped, not enough keys in active set.`);
        return;
    }

    const currentKey = await secretsFunctions.findSecret(provider.secret_key) || "";
    const currentKeyIndexInSet = activeKeys.indexOf(currentKey);
    let newKey = "";

    if (currentKeyIndexInSet !== -1) {
        // Key found in active set: Rotate within the set
        const nextKeyIndex = (currentKeyIndexInSet + 1) % activeKeys.length;
        newKey = activeKeys[nextKeyIndex];
        console.log(`${provider.name} (Set ${activeSetIndex}): Rotating from ${currentKey} (index ${currentKeyIndexInSet}) to ${newKey} (index ${nextKeyIndex})`);
    } else {
        // Current key is NOT in the active set. Set the first key of the active set as the new key.
        newKey = activeKeys[0];
        console.log(`${provider.name} (Set ${activeSetIndex}): Current key '${currentKey}' not in active set. Setting first key: ${newKey}`);
    }

    if (!newKey || newKey === currentKey) {
        console.log(`${provider.name} (Set ${activeSetIndex}): No rotation needed or possible.`);
        return;
    }

    // Update the active key secret ONLY
    await secretsFunctions.writeSecret(provider.secret_key, newKey);

    // Update UI info panel
    await updateProviderInfoPanel(provider, data); // Pass existing data

    console.log(`${provider.name} (Set ${activeSetIndex}) Key Rotated: ${currentKey} -> ${newKey}`);
}

// Handle key REMOVAL (Updated for dynamic sets - STRICT SEPARATION)
async function handleKeyRemoval(provider, failedKey) {
    console.log(`Attempting to remove failing key for ${provider.name}: ${failedKey}`);
    const loadedSecrets = await getSecrets();
    if (!loadedSecrets || !failedKey) return null;

    let data = await loadSetData(provider, loadedSecrets);
    let keyRemovedFromSet = false;
    let keyFoundInSetIndex = -1;
    let newKey = ""; // Default to empty

    // Find which set the failed key belongs to
    for (let i = 0; i < data.sets.length; i++) {
        let keysInSet = splitKeys(data.sets[i].keys);
        if (keysInSet.includes(failedKey)) {
            keyFoundInSetIndex = i;
            console.log(`Failed key ${failedKey} found in Set ${i} (${data.sets[i].name}) for ${provider.name}.`);
            // Remove the key
            keysInSet = keysInSet.filter(key => key !== failedKey);
            data.sets[i].keys = keysInSet.join("\n"); // Update the keys string in the data object
            keyRemovedFromSet = true;
            break; // Assume key is unique across sets (or remove first instance found)
        }
    }

    if (!keyRemovedFromSet) {
        console.warn(`Key ${failedKey} not found in any set lists for ${provider.name}. Checking main secret...`);
        const currentActiveKey = await secretsFunctions.findSecret(provider.secret_key);
        if (currentActiveKey === failedKey) {
            console.log(`Failed key matches the current main secret (but not in sets). Clearing main secret.`);
            await secretsFunctions.writeSecret(provider.secret_key, ""); // Clear the key
            // No need to save set data as it wasn't modified
            await redrawProviderUI(provider, data); // Redraw needed to reflect cleared main key in info panel
            return ""; // Indicate the main key was cleared
        }
        return null; // Key not found anywhere relevant
    }

    // Key was removed from set at `keyFoundInSetIndex`.
    // Now, determine the NEW active key ONLY IF the modified set IS the active set.
    const activeIndex = data.activeSetIndex;

    if (keyFoundInSetIndex === activeIndex) {
        // The active set was modified. Check if it still has keys.
        const modifiedActiveSetKeys = splitKeys(data.sets[activeIndex].keys);
        if (modifiedActiveSetKeys.length > 0) {
            // If keys remain, set the first one as the new active key.
            newKey = modifiedActiveSetKeys[0];
            console.log(`Active set ${activeIndex} modified. Using its first remaining key: ${newKey}`);
        } else {
            // If the active set is now EMPTY, the new key is empty string.
            newKey = "";
            console.log(`Active set ${activeIndex} is now empty after key removal. Setting active key to empty.`);
            // DO NOT change data.activeSetIndex here. It remains pointing at the empty set.
        }
        // Update the active key secret since the active set was involved
        await secretsFunctions.writeSecret(provider.secret_key, newKey);
    } else {
        // A non-active set was modified. The active key and active set index remain unchanged.
        console.log(`Key removed from non-active set ${keyFoundInSetIndex}. Active key (${await secretsFunctions.findSecret(provider.secret_key)}) and active set index (${activeIndex}) remain unchanged.`);
         // We still need to return *something* to indicate success, even if the main key didn't change.
         // Let's return the current active key in this case.
         newKey = await secretsFunctions.findSecret(provider.secret_key);
    }


    // Save the updated data structure (contains removed key from its set)
    await saveSetData(provider, data);

    // Redraw the entire UI section for this provider to reflect changes (e.g., updated textarea)
    await redrawProviderUI(provider, data); // Pass the updated data

    // Return the key that is now effectively active (might be empty string or unchanged from before)
    return newKey;
}

// Create a button element (unchanged)
async function createButton(title, onClick, classList = [], id = null) {
    const button = document.createElement("div");
    button.classList.add("menu_button", "menu_button_icon", "interactable", ...classList);
    button.title = title;
    button.onclick = onClick;
    if (id) button.id = id;

    const span = document.createElement("span");
    span.textContent = title;
    button.appendChild(span);

    return button;
}

// Initialize the plugin (just logs)
async function init(loadedSecrets) {
    console.log("MultiProviderKeySwitcher (Dynamic Sets) init");
}


// --- NEW: Function to redraw the dynamic UI for a provider ---
async function redrawProviderUI(provider, data) {
    const formElement = provider.get_form();
    if (!formElement) return;

    // Find or create the main container for this provider's switcher UI
    let mainContainer = formElement.querySelector(`#keyswitcher-main-${provider.secret_key}`);
    if (!mainContainer) {
         console.error(`Main container not found for ${provider.name} during redraw!`);
         return; // Should not happen if initial setup was correct
    }

    // Find the dynamic sets container within the main container
    let dynamicSetsContainer = mainContainer.querySelector(`#keyswitcher-sets-dynamic-${provider.secret_key}`);
    if (!dynamicSetsContainer) {
         console.error(`Dynamic sets container not found for ${provider.name} during redraw!`);
         return;
    }

    // Clear previous dynamic content
    dynamicSetsContainer.innerHTML = '';

    // Add "Manage Sets" heading
    const setsHeading = document.createElement("h5");
    setsHeading.textContent = "Manage Key Sets:";
    setsHeading.style.marginTop = "10px";
    setsHeading.style.marginBottom = "5px";
    dynamicSetsContainer.appendChild(setsHeading);


    // Rebuild the UI for each set
    data.sets.forEach((set, index) => {
        const setContainer = document.createElement("div");
        setContainer.style.border = "1px solid #555";
        setContainer.style.padding = "8px";
        setContainer.style.marginBottom = "10px";
        setContainer.style.borderRadius = "4px";
        setContainer.classList.add('keyswitcher-set-item');
        setContainer.dataset.setIndex = index; // Store index

        // Highlight active set
        if (index === data.activeSetIndex) {
            setContainer.style.borderColor = "#77cc77"; // Highlight color
            setContainer.style.backgroundColor = "rgba(119, 204, 119, 0.1)";
        }

        // Set Name Input
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.classList.add("text_pole", "text_pole_compact");
        nameInput.placeholder = `Set ${index} Name`;
        nameInput.value = set.name || "";
        nameInput.title = "Set Name";
        nameInput.style.marginBottom = "5px";
        nameInput.addEventListener("change", async () => {
            data.sets[index].name = nameInput.value.trim();
            await saveSetData(provider, data);
            await updateProviderInfoPanel(provider, data); // Update info panel if active set name changed
        });

        // Keys Textarea
        const keysTextarea = document.createElement("textarea");
        keysTextarea.classList.add("text_pole", "textarea_compact", "autoSetHeight");
        keysTextarea.placeholder = `Enter API Keys for Set ${index} (one per line or ';')`;
        keysTextarea.style.height = "60px"; // Smaller default height
        keysTextarea.style.minHeight = "40px";
        keysTextarea.value = set.keys || "";
        keysTextarea.title = "API Keys for this set";
        keysTextarea.addEventListener("change", async () => {
             const keys = splitKeys(keysTextarea.value); // Normalize keys
             keysTextarea.value = keys.join("\n");
             data.sets[index].keys = keys.join("\n");
             await saveSetData(provider, data);

             // If this is the active set AND the main key is now invalid/empty or not in the new list, update it?
             const currentActiveKey = await secretsFunctions.findSecret(provider.secret_key);
             if (index === data.activeSetIndex) {
                 const newActiveKey = keys.length > 0 ? keys[0] : "";
                 if (!currentActiveKey || !keys.includes(currentActiveKey)) {
                     if (currentActiveKey !== newActiveKey) {
                         console.log(`Set ${index} (Active) keys changed, updating main key.`);
                         await secretsFunctions.writeSecret(provider.secret_key, newActiveKey);
                         await updateProviderInfoPanel(provider, data); // Update info panel immediately
                     }
                 } else if (currentActiveKey !== keys[0] && keys.length > 0 && currentActiveKey === "") {
                     // If the active key was empty and now we have keys, set the first one
                      await secretsFunctions.writeSecret(provider.secret_key, keys[0]);
                     await updateProviderInfoPanel(provider, data);
                 }
             }
        });

        // Button Row for Set Actions
        const setButtonRow = document.createElement('div');
        setButtonRow.style.display = 'flex';
        setButtonRow.style.gap = '5px';
        setButtonRow.style.marginTop = '5px';

        // Set Active Button (only if not already active)
        if (index !== data.activeSetIndex) {
            const setActiveButton = createButton("Set Active", async () => {
                data.activeSetIndex = index;
                // Immediately set the first key of the NEW active set as the main key
                const newActiveKeys = splitKeys(data.sets[index].keys);
                const newFirstKey = newActiveKeys.length > 0 ? newActiveKeys[0] : "";
                console.log(`${provider.name}: Switching active set to ${index}. Setting key: ${newFirstKey}`);
                await secretsFunctions.writeSecret(provider.secret_key, newFirstKey);
                await saveSetData(provider, data);
                await redrawProviderUI(provider, data); // Redraw to update highlight and info
            }, ["set_action_button"], `setactive_btn_${provider.secret_key}_${index}`);
            setButtonRow.appendChild(setActiveButton);
        } else {
             const isActiveLabel = document.createElement('span');
             isActiveLabel.textContent = '✓ Active';
             isActiveLabel.style.fontWeight = 'bold';
             isActiveLabel.style.color = '#77cc77';
             isActiveLabel.style.padding = '5px';
              isActiveLabel.style.alignSelf = 'center';
             setButtonRow.appendChild(isActiveLabel);
        }

        // Remove Set Button (only if more than one set exists)
        if (data.sets.length > 1) {
            const removeSetButton = createButton("Remove", async () => {
                if (!confirm(`Are you sure you want to remove Set ${index} ("${set.name}")?`)) return;

                const removedSetName = data.sets[index].name;
                data.sets.splice(index, 1); // Remove the set

                // Adjust activeSetIndex if needed
                if (data.activeSetIndex === index) {
                    // If the active set was removed, default to the first set (index 0)
                    data.activeSetIndex = 0;
                    console.log(`Removed active set "${removedSetName}". Setting index 0 as new active.`);
                    // Set the first key of the *new* active set
                     const newActiveKeys = data.sets.length > 0 ? splitKeys(data.sets[0].keys) : [];
                     const newFirstKey = newActiveKeys.length > 0 ? newActiveKeys[0] : "";
                     await secretsFunctions.writeSecret(provider.secret_key, newFirstKey);

                } else if (data.activeSetIndex > index) {
                    // If a set *before* the active one was removed, decrement the active index
                    data.activeSetIndex--;
                    console.log(`Removed set "${removedSetName}" before active set. Adjusting active index to ${data.activeSetIndex}.`);
                } else {
                     console.log(`Removed set "${removedSetName}". Active index (${data.activeSetIndex}) remains unchanged.`);
                }

                await saveSetData(provider, data);
                await redrawProviderUI(provider, data); // Redraw everything
            }, ["set_action_button", "generic_negative_button"], `removeset_btn_${provider.secret_key}_${index}`); // Added negative class
             removeSetButton.style.marginLeft = 'auto'; // Push remove button to the right
             setButtonRow.appendChild(removeSetButton);
        }

        // Append elements to set container
        setContainer.appendChild(nameInput);
        setContainer.appendChild(keysTextarea);
        setContainer.appendChild(setButtonRow);

        // Append set container to the dynamic area
        dynamicSetsContainer.appendChild(setContainer);
    });

    // "Add New Set" Button (always present below the sets)
    const addNewSetButton = createButton("Add New Key Set", async () => {
        data.sets.push({ name: `Set ${data.sets.length}`, keys: "" }); // Add default empty set
        await saveSetData(provider, data);
        await redrawProviderUI(provider, data); // Redraw to include the new set
    }, ["add_set_button"], `addset_btn_${provider.secret_key}`);
    addNewSetButton.style.marginTop = '10px';
    dynamicSetsContainer.appendChild(addNewSetButton);


    // Update the separate info panel after potential changes
    await updateProviderInfoPanel(provider, data);
}


// --- jQuery ready function (Major Changes for Dynamic UI) ---
jQuery(async () => {
    console.log("MultiProviderKeySwitcher (Dynamic Sets): jQuery ready, initializing...");

    // Override toastr.error (Updated to call modified removal/rotation)
    const originalToastrError = toastr.error;
    toastr.error = async function(...args) {
        originalToastrError(...args);
        console.log("Toastr Error Args:", args);
        console.error(...args);

        const [errorMessage, errorTitle] = args;

        for (const provider of Object.values(PROVIDERS)) {
            if (isProviderSource(provider)) {
                console.log(`Error occurred while ${provider.name} was active.`);
                let keyRemoved = false;
                let removedKeyValue = null;
                 const currentSwitchingEnabled = keySwitchingEnabled[provider.secret_key];

                const failedKey = await secretsFunctions.findSecret(provider.secret_key);
                console.log(`Key that potentially failed for ${provider.name}: ${failedKey}`);

                if (failedKey && currentSwitchingEnabled) {
                    const statusCodeMatch = errorMessage.match(/\b(\d{3})\b/);
                    let statusCode = null;
                    if (statusCodeMatch) statusCode = parseInt(statusCodeMatch[1], 10);

                    const isRemovalStatusCode = REMOVAL_STATUS_CODES.includes(statusCode);
                    const isRemovalMessage = REMOVAL_MESSAGE_REGEX.test(errorMessage);

                    if (isRemovalStatusCode || isRemovalMessage) {
                        console.log(`Removal trigger matched for ${provider.name} (Switching ON). Code: ${statusCode}, Message Match: ${isRemovalMessage}. Trying removal for key: ${failedKey}`);
                        const newKey = await handleKeyRemoval(provider, failedKey); // Calls updated removal logic
                        if (newKey !== null) { // Removal logic returns null if key wasn't found/removed
                            keyRemoved = true;
                            removedKeyValue = failedKey;
                            console.log(`Key removal process completed for ${failedKey}. New active key might be '${newKey}'.`);
                            // UI redraw is handled within handleKeyRemoval now
                        } else {
                            console.log(`Key ${failedKey} was not processed for removal (not found?).`);
                        }
                    } else {
                        console.log(`Error for ${provider.name} (Switching ON) did not match removal triggers. Attempting rotation instead.`);
                        // Still attempt rotation on *any* error if switching is on?
                        await handleKeyRotation(provider.secret_key); // Calls updated rotation logic
                         // UI update handled within handleKeyRotation
                    }
                } else if (failedKey) {
                     console.log(`Error for ${provider.name} occurred, but Key Switching is OFF. No key removal/rotation attempted.`);
                } else {
                     console.log(`Error for ${provider.name} occurred, but no active key was found. Cannot process key.`);
                }

                // Show details popup if enabled
                if (showErrorDetails[provider.secret_key]) {
                     // Reload data for popup context? Maybe not necessary.
                     // const dataForPopup = await loadSetData(provider, await getSecrets());
                     showErrorPopup(provider, errorMessage, errorTitle || `${provider.name} API Error`, keyRemoved, removedKeyValue);
                }
                 break;
            }
        }
    };

    // Initial secret load
    const initialLoadedSecrets = await getSecrets();
    if (!initialLoadedSecrets) {
        console.error("MultiProviderKeySwitcher: Failed to load secrets. Aborting initialization.");
        toastr.error("KeySwitcher: Failed to load secrets. Key management disabled.", "Initialization Error");
        return;
    }
    await init(initialLoadedSecrets);

    // --- UI Setup Loop ---
    for (const provider of Object.values(PROVIDERS)) {
        console.log(`Setting up UI for provider: ${provider.name}`);
        const formElement = provider.get_form();
        if (!formElement) {
            console.warn(`Could not find form element for ${provider.name} (ID: ${provider.form_id})`);
            continue; // Skip this provider if form not found
        }

        // Load this provider's specific set data
        const data = await loadSetData(provider, initialLoadedSecrets);

        // --- Create the Main Static Container ---
        const mainContainer = document.createElement("div");
        mainContainer.id = `keyswitcher-main-${provider.secret_key}`;
        mainContainer.classList.add("keyswitcher-provider-container");
        mainContainer.style.marginTop = "15px";
        mainContainer.style.marginBottom = "15px";
        mainContainer.style.border = "1px solid #444";
        mainContainer.style.padding = "10px";
        mainContainer.style.borderRadius = "5px";

        // --- Heading ---
        const heading = document.createElement("h4");
        heading.textContent = `${provider.name} - Key Set Manager`;
        heading.style.marginTop = "0px";
        heading.style.marginBottom = "10px";
        mainContainer.appendChild(heading);

        // --- Static Info Panel ---
        const infoPanel = document.createElement("div");
        infoPanel.id = `keyswitcher-info-${provider.secret_key}`;
        infoPanel.style.marginBottom = "10px";
        infoPanel.style.padding = "8px";
        infoPanel.style.border = "1px dashed #666";
        infoPanel.style.borderRadius = "4px";
        // Create divs for info, content set by updateProviderInfoPanel
        const activeSetDiv = document.createElement("div"); activeSetDiv.id = `active_set_info_${provider.secret_key}`;
        const currentKeyDiv = document.createElement("div"); currentKeyDiv.id = `current_key_${provider.secret_key}`;
        const lastKeyDiv = document.createElement("div"); lastKeyDiv.id = `last_key_${provider.secret_key}`;
        const switchStatusDiv = document.createElement("div"); switchStatusDiv.id = `switch_key_${provider.secret_key}`;
        const errorToggleDiv = document.createElement("div"); errorToggleDiv.id = `show_${provider.secret_key}_error`;
        infoPanel.appendChild(activeSetDiv);
        infoPanel.appendChild(currentKeyDiv);
        infoPanel.appendChild(lastKeyDiv);
        infoPanel.appendChild(switchStatusDiv);
        infoPanel.appendChild(errorToggleDiv);
        mainContainer.appendChild(infoPanel);

         // --- Static Global Control Buttons ---
         const globalButtonContainer = document.createElement("div");
         globalButtonContainer.classList.add("key-switcher-buttons", "flex-container", "flex");
         globalButtonContainer.style.marginBottom = "10px";
         globalButtonContainer.style.flexWrap = "wrap";
         globalButtonContainer.style.gap = "5px";

         const keySwitchingButton = createButton("Toggle Auto Switching/Removal", async () => {
             keySwitchingEnabled[provider.secret_key] = !keySwitchingEnabled[provider.secret_key];
            // Inside the keySwitchingButton onClick handler:
			localStorage.setItem(`switch_key_${provider.secret_key}_dynamic`, keySwitchingEnabled[provider.secret_key].toString()); // <-- Added suffix
             await updateProviderInfoPanel(provider, await loadSetData(provider, await getSecrets())); // Update text
         }, ["global_control_button"], `toggle_switching_btn_${provider.secret_key}`);

         const rotateManuallyButton =  createButton("Rotate Key in Active Set Now", async () => {
              console.log(`Manual rotation requested for ${provider.name} (Active Set)`);
              await handleKeyRotation(provider.secret_key); // Rotates within active set
              // UI update handled within handleKeyRotation
          }, ["global_control_button"], `rotate_now_btn_${provider.secret_key}`);

         const errorToggleButton = createButton("Toggle Error Details Popup", async () => {
             showErrorDetails[provider.secret_key] = !showErrorDetails[provider.secret_key];
			// Inside the errorToggleButton onClick handler:
			localStorage.setItem(`show_${provider.secret_key}_error_dynamic`, showErrorDetails[provider.secret_key].toString()); // <-- Added suffix
             await updateProviderInfoPanel(provider, await loadSetData(provider, await getSecrets())); // Update text
         }, ["global_control_button"], `toggle_error_btn_${provider.secret_key}`);

         globalButtonContainer.appendChild(keySwitchingButton);
         globalButtonContainer.appendChild(rotateManuallyButton);
         globalButtonContainer.appendChild(errorToggleButton);
         mainContainer.appendChild(globalButtonContainer);


        // --- Dynamic Sets Container ---
        const dynamicSetsContainer = document.createElement("div");
        dynamicSetsContainer.id = `keyswitcher-sets-dynamic-${provider.secret_key}`;
        mainContainer.appendChild(dynamicSetsContainer);

        // --- Inject the main container into the form ---
         const insertBeforeElement = formElement.querySelector('hr:not(.key-switcher-hr), button, .form_section_block'); // Avoid inserting before our own hr
         const separatorHr = document.createElement("hr"); // Add a separator before our section
         separatorHr.classList.add("key-switcher-hr");

        if (insertBeforeElement) {
             formElement.insertBefore(separatorHr, insertBeforeElement);
             formElement.insertBefore(mainContainer, insertBeforeElement);
        } else {
            // Fallback: Append to the end
            formElement.appendChild(separatorHr);
            formElement.appendChild(mainContainer);
        }

        // --- Initial Draw of Dynamic UI and Info Panel ---
        await redrawProviderUI(provider, data); // Call the redraw function to populate dynamic sets
        // updateProviderInfoPanel is called at the end of redrawProviderUI

    } // End of loop through providers

    // --- Event Listeners ---

    // Model change listener (no changes needed)
    scriptFunctions.eventSource.on(scriptFunctions.event_types.CHATCOMPLETION_MODEL_CHANGED, async (model) => { /* ...unchanged log... */ });

    // Automatic rotation listener (Uses updated rotation logic)
    scriptFunctions.eventSource.on(scriptFunctions.event_types.CHAT_COMPLETION_SETTINGS_READY, async () => {
        console.log("Chat completion settings ready, checking for key rotation...");
        const currentSource = oaiFunctions.oai_settings.chat_completion_source;
        // console.log(`Current chat_completion_source: ${currentSource}`);

        for (const provider of Object.values(PROVIDERS)) {
            if (isProviderSource(provider)) {
                 const currentSwitchingEnabled = keySwitchingEnabled[provider.secret_key];
                if (currentSwitchingEnabled) {
                    console.log(`Provider ${provider.name} is active and switching is enabled. Attempting key rotation (active set).`);
                    await handleKeyRotation(provider.secret_key); // Calls updated rotation
                } else {
                     // console.log(`Provider ${provider.name} is active but switching is disabled.`);
                }
                 break;
            }
        }
    });

    console.log("MultiProviderKeySwitcher (Dynamic Sets): Initialization complete.");
});

// Export the plugin's init function (unchanged)
export default exports.default;
