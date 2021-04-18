# c-super-select lwc component

This is an open source lwc component that you can deploy to your salesforce org and use it on any of your custom LWC implementations. c-super-select lwc is intitive single/multi-select picklist component that both works with object.picklistfield and jsonArray datasources (in the any lookup or junction record selction context).

A free component by [Aspire Bright LLC](https://www.aspirebright.com/)

## For deploying c-super-select & c-sample-super-select to your Salesforce Org, please follow the below instructions.

Make sure to start from a brand-new salesforce project on vs code environment to avoid conflicts with previous work you may have done.

1. Clone this repository:

    ```
    git clone https://github.com/aspirebright/super-select.git
    cd super-select
    ```

2. Authorize your Trailhead Playground or Developer org and provide it with an alias (**mydevorg** in the command below):

    ```
    sfdx force:auth:web:login -s -a mydevorg
    ```

3. If you are setting up a Developer Edition: go to **Setup**, under **My Domain**, [register a My Domain](https://help.salesforce.com/articleView?id=domain_name_setup.htm&type=5).

4. Run this command in a terminal to deploy the app.

    ```
    sfdx force:source:deploy -p force-app
    ```

5. After successful deployment, enable the "Super Select Demo" Flexi Page Tab for System Admins and other permission sets on the deployed Org to take look at super-select demo.
