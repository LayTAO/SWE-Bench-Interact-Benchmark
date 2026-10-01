### Description

Before interaction, the multi-select and simple select component have the same appearance. For the simple select component, any interaction with the "please select" field opens the dropdown for selection.
For the multi-select, the drop down is only opened when a user clicks on the down arrow, this functionality is likely because of the search function present.
However, particularly in scenarios when a multi-select follows a simple select, because of the identical appearance this change of functionality is not clear and the multi-select feels broken.

### Reproduction

https://carbon.sage.com/?path=/docs/select-multiselect--docs

### Steps to reproduce

_No response_

### JIRA ticket numbers (Sage only)

_No response_

### Suggested solution

If this was wanting to be resolved there are two potential options:
1. Align the functionality - change the multi-select so that interaction with the "please select" field opens the dropdown and initiates the search
2. Misalign the appearance - If the functionality is to remain the same, then change the appearance even marginally may indicate to the user that these components behave differently

### Carbon version

126.9.1

### Design tokens version

_No response_

### Relevant browsers

Chrome

### Relevant OSs

MacOS

### Additional context

_No response_

### Confidentiality

- [X] I confirm there is no confidential or commercially sensitive information included.
