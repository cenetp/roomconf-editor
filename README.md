# RoomConf Editor

Produces room configurations in the AGraphML format and can be connected to the MetisCBR framework (see http://veisen.de/metiscbr).

See the editor in action: http://veisen.de/metiscbr/roomconf.

# Installation

Install `npm` for your OS and run following commands in the application's root directory:

    npm install --save --legacy-peer-deps
    npm install -D @webpack-cli/serve --save --legacy-peer-deps

# Run

Run `npm run start` to quickstart a development server with the editor.

OR: deploy the contents of the `dist` directory to your web server.

# AGraphML Visualization

You can use your own AGraphML files for visualization with the RoomConf Editor. Just put the contents into the code box that can be activated by clicking `</>` and then click `Apply AGraphML`.
