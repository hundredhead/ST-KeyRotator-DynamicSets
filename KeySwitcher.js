// @ts-nocheck
import * as script from "../../../../../script.js";
import * as secrets from "../../../../../scripts/secrets.js";
import * as oai from "../../../../../scripts/openai.js";
import * as popup from "../../../../../scripts/popup.js";
import { SECRET_KEYS } from "../../../../../scripts/secrets.js";

// --- Keep All Function Definitions and Constants HERE ---
// (getProviderDataSecretKey, PROVIDERS, PROVIDER_ERROR_MAPPINGS, REMOVAL_STATUS_CODES, etc.)
// (isProviderSource, showErrorPopup, getSecrets, saveKey, getDefaultSetData, loadSetData, saveSetData, etc.)
// (getActiveKeysString, splitKeys, updateProviderInfoPanel, handleKeyRotation, handleKeyRemoval, createButton, init, redrawProviderUI)

// --- Global Toggles State (Initialize Early) ---
let keySwitchingEnabled = {};
let showErrorDetails = {};

Object.values(PROVIDERS).forEach(provider => {
    // Use unique keys for dynamic version
    keySwitchingEnabled[provider.secret_key] = localStorage.getItem(`switch_key_${provider.secret_key}_dynamic`) === "true";
    showErrorDetails[provider.secret_key] = localStorage.getItem(`show_${provider.secret_key}_error_dynamic`) !== "false";
});


// --- Override toastr.error (Define Early, make robust) ---
const originalToastrError = toastr.error;
toastr.error = async function(...args) {
    originalToastrError(...args); // Call the original first
    console.log("Toastr Error Args:", args);
    console.error(...args);

    const [errorMessage, errorTitle] = args;

    // Check if oaiFunctions and settings are ready before proceeding
    if (!oai || !oai.oai_settings) {
        console.warn("KeySwitcher: toastr.error called before oai_settings are ready. Cannot process key removal/rotation yet.");
        // Optionally show a basic popup even if settings aren't ready
        // We might need a global way to check if showErrorDetails is enabled here.
        // Maybe check localStorage directly for the toggle?
        // if (localStorage.getItem(`show_SOME_DEFAULT_OR_LAST_PROVIDER_error_dynamic`) !== "false") {
        //    showErrorPopup(null, errorMessage, errorTitle || "API Error (Early)");
        // }
        return; // Stop processing if core settings aren't loaded
    }

    // Proceed only if settings are ready
    for (const provider of Object.values(PROVIDERS)) {
        if (isProviderSource(provider)) { // isProviderSource now uses oai.oai_settings
            console.log(`Error occurred while ${provider.name} was active.`);
            let keyRemoved = false;
            let removedKeyValue = null;
            const currentSwitchingEnabled = keySwitchingEnabled[provider.secret_key];
            const failedKey = await secretsFunctions.findSecret(provider.secret_key);

            if (failedKey && currentSwitchingEnabled) {
                // ... (Rest of the key removal/rotation logic as before) ...
                 const statusCodeMatch = errorMessage.match(/\b(\d{3})\b/);
                 let statusCode = null;
                 if (statusCodeMatch) statusCode = parseInt(statusCodeMatch[1], 10);

                 const isRemovalStatusCode = REMOVAL_STATUS_CODES.includes(statusCode);
                 const isRemovalMessage = REMOVAL_MESSAGE_REGEX.test(errorMessage);

                 if (isRemovalStatusCode || isRemovalMessage) {
                     console.log(`Removal trigger matched for ${provider.name}...`);
                     const newKey = await handleKeyRemoval(provider, failedKey);
                     if (newKey !== null) {
                         keyRemoved = true;
                         removedKeyValue = failedKey;
                         console.log(`Key removal process completed...`);
                     } else {
                         console.log(`Key ${failedKey} was not processed for removal...`);
                     }
                 } else {
                     console.log(`Error for ${provider.name} did not match removal triggers. Attempting rotation...`);
                     await handleKeyRotation(provider.secret_key);
                 }
            } else {
                 console.log(`Error for ${provider.name} occurred, but switching is OFF or no active key found.`);
            }

            if (showErrorDetails[provider.secret_key]) {
                showErrorPopup(provider, errorMessage, errorTitle || `${provider.name} API Error`, keyRemoved, removedKeyValue);
            }
            break; // Found the active provider, stop checking
        }
    }
};


// --- Main Initialization Logic (Moved to Event Listener) ---
let isInitialized = false; // Flag to prevent running setup multiple times

script.eventSource.on(script.event_types.CHAT_COMPLETION_SETTINGS_READY, async () => {
    if (isInitialized) {
       // console.log("KeySwitcher: Settings ready event fired again, already initialized.");
       // Optionally, re-run rotation check here if needed, but initial setup is done.
       // Example: Check rotation on subsequent setting changes
       // console.log("Chat completion settings ready again, checking for key rotation...");
       // const currentSource = oai.oai_settings.chat_completion_source;
       // for (const provider of Object.values(PROVIDERS)) {
       //     if (isProviderSource(provider)) {
       //         if (keySwitchingEnabled[provider.secret_key]) {
       //             await handleKeyRotation(provider.secret_key);
       //         }
       //         break;
       //     }
       // }
       return;
    }
    isInitialized = true;
    console.log("KeySwitcher (Dynamic Sets): CHAT_COMPLETION_SETTINGS_READY received. Initializing UI...");

    // --- Now safe to load secrets ---
    const initialLoadedSecrets = await getSecrets(); // Should work now
    if (!initialLoadedSecrets) {
        console.error("MultiProviderKeySwitcher: Failed to load secrets AFTER settings ready. Aborting initialization.");
        toastr.error("KeySwitcher: Failed to load secrets. Key management disabled.", "Initialization Error");
        return; // Stop if secrets still fail
    }
    await init(initialLoadedSecrets); // Call the simple init log function

    // --- UI Setup Loop (Now inside the event listener) ---
    for (const provider of Object.values(PROVIDERS)) {
        console.log(`Setting up UI for provider: ${provider.name}`);
        const formElement = provider.get_form();
        if (!formElement) {
            console.warn(`Could not find form element for ${provider.name} (ID: ${provider.form_id})`);
            continue;
        }

        // Load this provider's specific set data
        const data = await loadSetData(provider, initialLoadedSecrets);

        // Check if UI already injected (e.g., if event fired multiple times unexpectedly)
        if (formElement.querySelector(`#keyswitcher-main-${provider.secret_key}`)) {
            console.log(`KeySwitcher UI for ${provider.name} already present. Skipping injection.`);
             // Optionally just update the existing UI instead of full redraw/injection
             await redrawProviderUI(provider, data); // Update dynamic parts
            continue;
        }


        // --- Create the Main Static Container ---
        const mainContainer = document.createElement("div");
        // ... (rest of mainContainer setup) ...
         mainContainer.id = `keyswitcher-main-${provider.secret_key}`;
         mainContainer.classList.add("keyswitcher-provider-container");
         mainContainer.style.marginTop = "15px";
         mainContainer.style.marginBottom = "15px";
         mainContainer.style.border = "1px solid #444";
         mainContainer.style.padding = "10px";
         mainContainer.style.borderRadius = "5px";


        // --- Heading ---
        const heading = document.createElement("h4");
        // ... (heading setup) ...
         heading.textContent = `${provider.name} - Key Set Manager`;
         heading.style.marginTop = "0px";
         heading.style.marginBottom = "10px";
         mainContainer.appendChild(heading);

        // --- Static Info Panel ---
        const infoPanel = document.createElement("div");
        // ... (infoPanel setup, create child divs) ...
         infoPanel.id = `keyswitcher-info-${provider.secret_key}`;
         infoPanel.style.marginBottom = "10px";
         infoPanel.style.padding = "8px";
         infoPanel.style.border = "1px dashed #666";
         infoPanel.style.borderRadius = "4px";
         const activeSetDiv = document.createElement("div"); activeSetDiv.id = `active_set_info_${provider.secret_key}`;
         const currentKeyDiv = document.createElement("div"); currentKeyDiv.id = `current_key_${provider.secret_key}`;
         const lastKeyDiv = document.createElement("div"); lastKeyDiv.id = `last_key_${provider.secret_key}`;
         const switchStatusDiv = document.createElement("div"); switchStatusDiv.id = `switch_key_${provider.secret_key}`;
         const errorToggleDiv = document.createElement("div"); errorToggleDiv.id = `show_${provider.secret_key}_error_dynamic`; // Ensure unique ID if needed
         infoPanel.appendChild(activeSetDiv);
         infoPanel.appendChild(currentKeyDiv);
         infoPanel.appendChild(lastKeyDiv);
         infoPanel.appendChild(switchStatusDiv);
         infoPanel.appendChild(errorToggleDiv);
         mainContainer.appendChild(infoPanel);


         // --- Static Global Control Buttons ---
         const globalButtonContainer = document.createElement("div");
         // ... (globalButtonContainer setup) ...
          globalButtonContainer.classList.add("key-switcher-buttons", "flex-container", "flex");
          globalButtonContainer.style.marginBottom = "10px";
          globalButtonContainer.style.flexWrap = "wrap";
          globalButtonContainer.style.gap = "5px";


         // Use the fixed createButton calls (without await)
         const keySwitchingButton = createButton("Toggle Auto Switching/Removal", async () => {
             keySwitchingEnabled[provider.secret_key] = !keySwitchingEnabled[provider.secret_key];
             localStorage.setItem(`switch_key_${provider.secret_key}_dynamic`, keySwitchingEnabled[provider.secret_key].toString());
             await updateProviderInfoPanel(provider, await loadSetData(provider, await getSecrets()));
         }, ["global_control_button"], `toggle_switching_btn_${provider.secret_key}`);

         const rotateManuallyButton = createButton("Rotate Key in Active Set Now", async () => {
              console.log(`Manual rotation requested for ${provider.name} (Active Set)`);
              await handleKeyRotation(provider.secret_key);
          }, ["global_control_button"], `rotate_now_btn_${provider.secret_key}`);

         const errorToggleButton = createButton("Toggle Error Details Popup", async () => {
             showErrorDetails[provider.secret_key] = !showErrorDetails[provider.secret_key];
             localStorage.setItem(`show_${provider.secret_key}_error_dynamic`, showErrorDetails[provider.secret_key].toString());
             await updateProviderInfoPanel(provider, await loadSetData(provider, await getSecrets()));
         }, ["global_control_button"], `toggle_error_btn_${provider.secret_key}`);

         globalButtonContainer.appendChild(keySwitchingButton);
         globalButtonContainer.appendChild(rotateManuallyButton);
         globalButtonContainer.appendChild(errorToggleButton);
         mainContainer.appendChild(globalButtonContainer);


        // --- Dynamic Sets Container ---
        const dynamicSetsContainer = document.createElement("div");
        // ... (dynamicSetsContainer setup) ...
         dynamicSetsContainer.id = `keyswitcher-sets-dynamic-${provider.secret_key}`;
         mainContainer.appendChild(dynamicSetsContainer);


        // --- Inject the main container into the form ---
         const insertBeforeElement = formElement.querySelector('hr:not(.key-switcher-hr), button, .form_section_block');
         const separatorHr = document.createElement("hr");
         separatorHr.classList.add("key-switcher-hr");

        if (insertBeforeElement) {
             formElement.insertBefore(separatorHr, insertBeforeElement);
             formElement.insertBefore(mainContainer, insertBeforeElement);
        } else {
            formElement.appendChild(separatorHr);
            formElement.appendChild(mainContainer);
        }

        // --- Initial Draw of Dynamic UI and Info Panel ---
        await redrawProviderUI(provider, data);

    } // End of loop through providers

    // --- Automatic Rotation Check (Now safe to run) ---
     console.log("Initial setup complete. Performing initial rotation check.");
     const currentSource = oai.oai_settings.chat_completion_source;
     for (const provider of Object.values(PROVIDERS)) {
         if (isProviderSource(provider)) {
             if (keySwitchingEnabled[provider.secret_key]) {
                 console.log(`Provider ${provider.name} is active and switching is enabled. Attempting initial key rotation (active set).`);
                 await handleKeyRotation(provider.secret_key);
             }
             break;
         }
     }

     console.log("KeySwitcher (Dynamic Sets): Initialization complete.");

}); // End of CHAT_COMPLETION_SETTINGS_READY listener


// --- Remove the old jQuery(async () => { ... }); block ---
// jQuery(async () => {
//    // All this logic is now inside the event listener above
// });


// Export the plugin's init function (unchanged)
export default init; // Just export the simple log function
