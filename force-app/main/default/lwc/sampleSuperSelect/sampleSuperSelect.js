import { LightningElement, track } from 'lwc';

export default class SampleSuperSelect extends LightningElement {

    @track multiSelectConfigSample = {
        mode: "edit", //expected values: read, edit; default: read
        label: "Account Source",
        labelStyle: "font-weight: bold",
        minSearchLength: 0, 
        placeHolder: "Search Account Source...",
        listOverflowStyle: "overflow-y: auto !important; max-height: 120px !important;", //defaults to "overflow-y: auto !important; max-height: 100px !important;" if not set.
        multiSelect: true, //value variations: true or false, defaults to false        
        alwaysShowList: true,
        required: {validation: true, message: "Complete this field", asterisk: true}, 
        dataSource: { 
            type: "picklist", //value variations: picklist or jsonArray, defaults to picklist
            objectApiName: "Account", 
            picklist: {
                fieldApiName: "Account.AccountSource", 
                recordTypeDeveloperName: "Customer",
                valueSubLabelMap: {"Other": "Other Source", "Phone Inquiry": "Phone Source", "Purchased List": "Purchase Source", "Web": "Web Address", }
            }
        },
        sort: {field: "value", order: "asc"},
        onSelect: {
            eventName: "accountsourceselect", //make this unique since there could be more than one superSelect on the parent component 
            selectedDataFormat: "jsonArray",  //jsonArray or semicolon-delimited-labels or comma-delimited-labels or semicolon-delimited-values or comma-delimited-values, default: jsonArray
            removedDataFormat: "jsonArray"  //jsonArray or semicolon-delimited-labels or comma-delimited-labels or semicolon-delimited-values or comma-delimited-values, default: jsonArray
        },
        onRemove: {
            eventName: "accountsourceremove", //make this unique since there could be more than one superSelect on the parent component
            selectedDataFormat: "jsonArray",  //jsonArray or semicolon-delimited-labels or comma-delimited-labels or semicolon-delimited-values or comma-delimited-values, default: jsonArray
            removedDataFormat: "jsonArray"  //jsonArray or semicolon-delimited-labels or comma-delimited-labels or semicolon-delimited-values or comma-delimited-values, default: jsonArray
        },
        icon: "standard:multi_select_checkbox",  //value variations for picklist options: slds icon names
        selectedItems: [{label: "Web", value: "Web", subLabel: "Test", icon:"standard:multi_select_checkbox" }],
        disabled: false
    };

    @track jsonArrayConfigSample = {
        mode: "edit", //expected values: read, edit; default: read
        label: "Junction Record Selection",
        labelStyle: "font-weight: bold",
        minSearchLength: 0, 
        placeHolder: "Search Account Source...",
        listOverflowStyle: "overflow-y: auto !important; max-height: 100px !important;", //defaults to "overflow-y: auto !important; max-height: 100px !important;" if not set.
        multiSelect: true, //value variations: true or false, defaults to false        
        required: {validation: true, message: "This field is required", asterisk: true}, 
        dataSource: { 
            type: "jsonArray", //value variations: picklist or jsonArray, defaults to picklist
            jsonArray: [
                { 
                    value: "Sample 1", 
                    label: "Sample 1",
                    subLabel: "Sample 1",
                    icon: "standard:multi_select_checkbox"                
                },
                { 
                    value: "Sample 2", 
                    label: "Sample 2",
                    subLabel: "Sample 2",
                    icon: "standard:multi_select_checkbox"                
                },
                { 
                    value: "Sample 3", 
                    label: "Sample 3",
                    subLabel: "Sample 4",
                    icon: "standard:multi_select_checkbox"                
                },
                { 
                    value: "Sample 4", 
                    label: "Sample 4",
                    subLabel: "Sample 4",
                    icon: "standard:multi_select_checkbox"                
                },
                { 
                    value: "Sample 5", 
                    label: "Sample 5",
                    subLabel: "Sample 5",
                    icon: "standard:multi_select_checkbox"                
                },
                { 
                    value: "Sample 6", 
                    label: "Sample 6",
                    subLabel: "Sample 6",
                    icon: "standard:multi_select_checkbox"                
                },
                { 
                    value: "Sample 7", 
                    label: "Sample 7",
                    subLabel: "Sample 7",
                    icon: "standard:multi_select_checkbox"                
                }
            ]
        },
        sort: {field: "value", order: "asc"},
        onSelect: {
            eventName: "accountsourceselect", //make this unique since there could be more than one superSelect on the parent component 
            selectedDataFormat: "jsonArray",  //jsonArray or semicolon-delimited-labels or comma-delimited-labels or semicolon-delimited-values or comma-delimited-values, default: jsonArray
            removedDataFormat: "jsonArray",  //jsonArray or semicolon-delimited-labels or comma-delimited-labels or semicolon-delimited-values or comma-delimited-values, default: jsonArray
            notAllowedToBeSelected: { 
                items: ["Sample 2"], 
                message: { type: "field-error", text: "Sample 2 can't be selected."}
            }
        },
        onRemove: {
            eventName: "accountsourceremove", //make this unique since there could be more than one superSelect on the parent component
            selectedDataFormat: "jsonArray",  //jsonArray or semicolon-delimited-labels or comma-delimited-labels or semicolon-delimited-values or comma-delimited-values, default: jsonArray
            removedDataFormat: "jsonArray",  //jsonArray or semicolon-delimited-labels or comma-delimited-labels or semicolon-delimited-values or comma-delimited-values, default: jsonArray
            notAllowedToBeRemoved: { 
                items: ["Sample 1"],
                message: { type: "toast", text: "Sample 1 can't be removed."}
            } //type toast/field-error
        },
        icon: "standard:multi_select_checkbox",  //value variations for picklist options: slds icon names
        selectedItems: [
            {
                value: "Sample 1", 
                label: "Sample 1",
                subLabel: "Sample 1",
                cssClasses: "",
                icon: "standard:multi_select_checkbox"   
            }
        ],
        disabled: false
    };

    selectedItemsMultiSelect;
    removedItemsMultiSelect;
    selectedItemsMultiSelectString;
    removedItemsMultiSelectString;

    //selection event
    handleAccountSourceSelectMultiSelect(event) {
        this.selectedItemsMultiSelectString = JSON.stringify(event.detail);
        this.selectedItemsMultiSelect = event.detail;
        this.removedItemsMultiSelectString = JSON.stringify(event.detail);
        this.removedItemsMultiSelect = event.detail;
    }

    //removal event 
    handleAccountSourceRemoveMultiSelect(event) {
        this.removedItemsMultiSelectString = JSON.stringify(event.detail);
        this.removedItemsMultiSelect = event.detail;
        this.selectedItemsMultiSelectString = JSON.stringify(event.detail);
        this.selectedItemsMultiSelect = event.detail;
    }

    //resetting from parent sample code
    handleResetRemoval() {
        if (this.removedItemsMultiSelect && this.removedItemsMultiSelect.removedItems) {
            this.template.querySelector('[data-id="AccountSourcePicklist"]').resetRemoval(this.removedItemsMultiSelect.removedItems, "Removed Items were added back since these Items can't be removed.", "toast")
            this.selectedItemsMultiSelect.selectedItems = [];
            this.selectedItemsMultiSelect.selectedItems.push(...this.removedItemsMultiSelect.removedItems);
            for (let i = 0; i < this.selectedItemsMultiSelect.selectedItems.length; i++){
                this.selectedItemsMultiSelect.removedItems = this.selectedItemsMultiSelect.removedItems.filter(element => element.value !== this.selectedItemsMultiSelect.selectedItems[i].value);
            }            
            this.selectedItemsMultiSelectString = JSON.stringify(this.selectedItemsMultiSelect);
            this.removedItemsMultiSelectString = "";
            this.removedItemsMultiSelect = undefined;
        }
    } 

    handleResetSelection() {
        if (this.selectedItemsMultiSelect && this.selectedItemsMultiSelect.selectedItems) {
            this.template.querySelector('[data-id="AccountSourcePicklist"]').resetSelection(this.selectedItemsMultiSelect.selectedItems, "Selected Items were removed since these Items can't be selected.", "field-error")
            this.selectedItemsMultiSelectString = "";
            this.selectedItemsMultiSelect = undefined;
            this.removedItemsMultiSelectString = "";
            this.removedItemsMultiSelect = undefined;
        }        
    } 

    selectedItemsJSON;
    removedItemsJSON;

    handleAccountSourceSelectJSON(event) {
        this.selectedItemsJSON = JSON.stringify(event.detail)
    }

    handleAccountSourceRemoveJSON(event) {
        this.removedItemsJSON = JSON.stringify(event.detail);
    }

}