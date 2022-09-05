
// enable vscode intellisense
if(false){ var FreightPacker = require('../../src/FreightPacker').default; }
// expose typedef s for intellisense
/** @typedef {import('../../src/api/Types').InitializationParams} InitializationParams */
/** @typedef {import('../../src/api/Types').SolverParams} SolverParams */
/** @typedef {import('../../src/api/Types').CUBParams} CUBParams */
/** @typedef {import('../../src/api/Types').BoxEntry} BoxEntry */

var fileLoader = new FreightPacker.utils.THREE.FileLoader();
var resultTable = '';
var counter = 0;
// var globalArray = [];
function loadFile(url){
    return new Promise((resolve, reject) => {
        fileLoader.load(url, resolve, undefined, reject);
    });
}

const typeofString = 'string',
    typeofNumber = 'number',
    typeofObject = 'object';

const signals = {
    // automate

    // packer
    packRequest: 'packRequest',
    sliceResults: 'sliceResults',

    // packing space
    loadPSConfig: 'loadPSConfig',
    inputPSConfig: 'inputPSConfig',

    // box input
    boxInputUpdate: 'boxInputUpdate',
    boxInputComplete: 'boxInputComplete',
    boxInputAbort: 'boxInputAbort',
    boxInputModify: 'boxInputModify',
    boxInputRemove: 'boxInputRemove',
    boxEntryRequest: 'boxEntryRequest'
};

class ExampleUI extends FreightPacker.utils.Signaler {
    constructor(inputData){
        super();
        let scope = this;

        // FreightPacker.CheckRequirements().then(
        //     () => { // success
        //         scope.test();
        //     },
        //     (errorMsg) => { // failure
        //         console.warn('FreightPacker requirements not met, error:', errorMsg);
        //         document.getElementById('no-webgl').style.display = 'block';
        //     }
        // );
        this.domElement = document.getElementById('fp-gui');
    
        var shortcutsGUI = FreightPacker.utils.Config.shortcutsGUI;
        shortcutsGUI.domElement.style.marginBottom = '40px';
        this.domElement.appendChild(shortcutsGUI.domElement);

        this.gui = new (window.dat || FreightPacker.utils.dat).GUI({
            autoPlace: false
        });

        this.domElement.appendChild(this.gui.domElement);

        var autoFolder = this.CreateAutoController();
        autoFolder.open();

        var packerFolder = this.CreatePackerController();

    
    }

    ParseCSVJobFile(){
        const spacesExp = new RegExp(' ', 'g');
        const newLineExp = new RegExp('\n', 'g');
        /** @param {string} str */
        function csv(str){
            str = str.replace(newLineExp, ',');
            return str.replace(spacesExp, '').split(',');
        }

        return new Promise((resolve, reject) => {
            IO.GetFile(function(content){
                // label, width, length, height, weightCapacity
                // format: label, width, length, height, weight, quantity
                var parser = new DOMParser();
                var xmlDoc = parser.parseFromString(content,"application/xml");

                var ContainerXML = xmlDoc.querySelectorAll('container');
            
                var ContainerXML = xmlDoc.getElementsByTagName("container")[0];
                
            
            //   console.log(ContainerXML.attributes);
            //   return false;
                var heightcoord  = ContainerXML.attributes[3]['value'];
                var widthcoord  = ContainerXML.attributes[2]['value'];
                var lenghtcoord = ContainerXML.attributes[1]['value'];
                var containerData = {
                    ID:   ContainerXML.attributes[0]['value'],
                    Dim1: heightcoord.replace(',','.'),
                    Dim2: lenghtcoord.replace(',','.'),
                    Dim3: widthcoord.replace(',','.'),
                    Weight: 49000
                    // data[5] is quantity = 1
                };
        
                var productLoad = xmlDoc.querySelectorAll('producttoload');
                var product     = xmlDoc.querySelectorAll('product');
                var block     = xmlDoc.querySelectorAll('block');
                var itemsData = [];
                var productIdNameFirst = '';

                product.forEach(itemBoxDetail => {
                   //console.log(itemBoxDetail,'ITEM BOX DETAIL');
                    block.forEach(itemBox => 
                    {
                        if(itemBoxDetail.attributes[0]['value'] == itemBox.attributes[2]['value'])
                        {
                            var heightDataBox = itemBox.attributes[10]['value'];
                            var lengthDataBox = itemBox.attributes[8]['value'];
                            var weightDataBox = itemBox.attributes[20]['value'];
                            var widthDataBox = itemBox.attributes[9]['value'];
                            var productId = itemBox.attributes[2]['value'];
                            var name = itemBox.attributes[3]['value'];
                            var deskripsi = itemBox.attributes[4]['value'];
                            var depthcoord = itemBox.attributes[11]['value'];
                            var widthcoord = itemBox.attributes[12]['value'];
                            var heightcoord = itemBox.attributes[13]['value'];
                            var secnumber = itemBox.attributes[27]['value'];
                            var jumlah = itemBox.attributes[19]['value'];

                            if (secnumber != 2) {
                                var color = itemBoxDetail.attributes[26]['value'];
                                if(itemBoxDetail.attributes[0]['value'] == 'prd 1')
                                {
                                    color = itemBoxDetail.attributes[29]['value'];
                                }
                                var item = {
                                    ID: productId,
                                    Dim1: heightDataBox.replace(',','.'),
                                    Dim2: lengthDataBox.replace(',','.'),
                                    Dim3: widthDataBox.replace(',','.'),
                                    Weight: weightDataBox,
                                    Color: Number(color),
                                    Quantity:  1,
                                    name : name,
                                    deskripsi   : deskripsi,
                                    depthcoord  : depthcoord.replace(',','.'),
                                    widthcoord  : widthcoord.replace(',','.'),
                                    heightcoord : heightcoord.replace(',','.'),
                                    jumlah      : jumlah,
                                };
                                itemsData.push(item);
                            }
                        }
                    })
                })
                var result = {
                    container: containerData,
                    items: itemsData
                };

                resolve(result);
            }, false);
        });
    }

    CreateAutoController(){
        var scope = this;

        var testDataFlatdeck = FreightPacker.utils.Debug.AFitTest.GenerateDataSampleFlatdeck2();
        var testData;

        var scale = 1;
        var itemQttMultiplier = 1;
        function testDataCargoAdd(){
            var items = testData.items;
            return new Promise((resolve, reject) => {
                let iid = setInterval(roll, 100);
                function roll(){
                    let item = items.pop();
                    if(item){
                        /** @type {import('../Example').UIEntry} */
                        let boxInput = {
                            label: item.ID.toString(),
                            name : item.name,
                            deskripsi : item.deskripsi,
                            depthcoord : item.depthcoord,
                            widthcoord : item.widthcoord,
                            heightcoord : item.heightcoord,
                            width: item.Dim1 * scale,
                            length: item.Dim2 * scale,
                            height: item.Dim3 * scale,
                            weight: '', //item.Weight || (item.Dim1 * item.Dim2 * item.Dim3 / 1000)
                            quantity: Math.floor(item.Quantity * itemQttMultiplier),
                            validOrientations: item.ValidOrientations,
                            stackingCapacity: item.StackingCapacity,
                            grounded: item.Grounded,
                            color : Number(item.Color),
                            jumlah : Number(item.jumlah),
                        };
                        // console.log(boxInput,'163');
                        scope.Dispatch(ExampleUI.signals.boxInputUpdate, boxInput, false);
                        scope.Dispatch(ExampleUI.signals.boxInputComplete);
                    }
                    else if(items.length <= 0){
                        clearInterval(iid);
                        setTimeout(resolve, 500);
                        //resolve();
                    }
                }
            });
        }

        var algorithm = 'cub';
        var algorithmArgs = [];
        function pack(){
            scope.Dispatch(signals.packRequest, algorithm, algorithmArgs);
        }

        const defaultPSConfig = '../resources/config/flatdeck48.json';
        var psConfig = defaultPSConfig;

        function parseCSVContainer(result){
            // console.log('parseCSVContainer(result):', result);
            if(result.container.ID === 'Flatdeck 48' || result.container.ID === 'Flatdeck48'){
                return samplePackingSpace('../resources/config/flatdeck48.json');
            }

            return new Promise( (resolve, reject) => {
                let containerData = {
                    width: result.container.Dim1 * scale, length: result.container.Dim2 * scale, height: result.container.Dim3 * scale, weightCapacity: result.container.Weight
                };
                scope.Dispatch(ExampleUI.signals.inputPSConfig, containerData);
                resolve();
            });
        }

        function loadXMLJob(){
            scope.ParseCSVJobFile()
            .then( (result) => {
                testData = result;
                algorithm = 'cub';
                algorithmArgs = ExampleUI.getCUBParams();

                parseCSVContainer(result)
                .then(testDataCargoAdd)
                .then(pack);
            });
        }

        function samplePackingSpace(psConfig){
            psConfig = psConfig || defaultPSConfig;
            return new Promise((resolve, reject) => {
                loadFile(psConfig)
                .then(function(data){
                    scope.Dispatch(ExampleUI.signals.loadPSConfig, data);
                    setTimeout(resolve, 500);
                    //resolve();
                });
            });
        }

        var controller = {
            LoadPackingSpace: samplePackingSpace,
            LoadXMLJob: loadXMLJob
        };

        var autoFolder = this.gui.addFolder('Automate');
        // autoFolder.add(controller, 'Flatdeck48_CUB');
        // autoFolder.add(controller, 'Flatdeck53_CUB');
        // //autoFolder.add(controller, 'CUB_Scaled');
        // autoFolder.add(controller, 'LoadPackingSpace');
        autoFolder.add(controller, 'LoadXMLJob');

        return autoFolder;
    }

    CreatePackerController(){
        var scope = this;

        function pack(){
            let algorithm = 'cub';
            scope.Dispatch(signals.packRequest, algorithm, ExampleUI.getCUBParams());
        }

        var controller = {
            minZToWasteRatio: 1,
            Solve: pack,
            resultSlice: 1
        };

        let resultSlice = 1;
        Object.defineProperties(controller, {
            ResultSlice: {
                get: function(){ return controller.resultSlice;},
                set: function(value){ 
                    controller.resultSlice = value;
                    scope.Dispatch(signals.sliceResults, value);
                }
            }
        });

        function getCUBParams(){
            return {score_minLength: controller.minZToWasteRatio, score_minWastedSpace: (1 - controller.minZToWasteRatio)};
        }

        ExampleUI.getCUBParams = getCUBParams;

        var packerFolder = this.gui.addFolder('Packer');
        packerFolder.add(controller, 'minZToWasteRatio', 0, 1).step(.1);
        packerFolder.add(controller, 'Solve');
        packerFolder.add(controller, 'ResultSlice', 0, 1).step(.1);

        return packerFolder;
    }

    CreateSpaceController(){
        var scope = this;

        function loadConfig(){
            IO.GetFile(function(file){
                var data = JSON.parse(file);
                scope.Dispatch(ExampleUI.signals.loadPSConfig, data);
            }, false);
        }

        var controller = {
            LoadPSConfig: loadConfig
        };

        var spaceFolder = this.gui.addFolder('Packing space');
        spaceFolder.add(controller, 'LoadPSConfig');

        return spaceFolder;
    }

    CreateInputController(){
        var scope = this;
        
        var boxRange = {w:[10, 120], l:[10, 120], h:[10, 120]};
        var boxInput = {
            width:0, length:0, height:0, label: '', weight: 0, quantity: 1, 
            validOrientations: 'xyz, zyx, yxz, yzx, zxy, xzy', stackingCapacity: -1, grounded: false,
            uid: ''
        };

        var needsUpdate = false;
        window.setInterval(function(){
            if(needsUpdate){
                needsUpdate = false;
                scope.Dispatch(ExampleUI.signals.boxInputUpdate, boxInput, true);
            }
        }, 1000 / 50);
        
        function inputUpdate(){
            needsUpdate = true;
        }
        function complete(){
            scope.Dispatch(ExampleUI.signals.boxInputComplete);
        }
        function abort(){
            scope.Dispatch(ExampleUI.signals.boxInputAbort);
        }

        var p = 4;
        function randomInput(){
            controller.Width    = Math.floor((boxRange.w[0] + Math.random() * (boxRange.w[1] - boxRange.w[0])) * p) / p;
            controller.Length   = Math.floor((boxRange.l[0] + Math.random() * (boxRange.l[1] - boxRange.l[0])) * p) / p;
            controller.Height   = Math.floor((boxRange.h[0] + Math.random() * (boxRange.h[1] - boxRange.h[0])) * p) / p;
            complete();
        }

        /** @param {BoxEntry} entry */
        function updateForEntry(entry){
            controller.EntryUID = entry.uid;

            controller.Width = entry.dimensions.width;
            controller.Length = entry.dimensions.length;
            controller.Height = entry.dimensions.height;
            controller.Label = entry.label;
            controller.Quantity = entry.quantity;
            controller.Weight = entry.weight;
            controller.ValidOrientations = entry.properties.rotation.enabled ? entry.properties.rotation.allowedOrientations.join(', ') : '';
            controller.StackingCapacity = entry.properties.stacking.enabled ? entry.properties.stacking.capacity : -1;
            controller.Grounded = entry.properties.translation.enabled && entry.properties.translation.grounded;
            // console.log(controller.EntryUID);
            needsUpdate = false;
            
            inputFolder.updateAll();
        }

        ExampleUI.UpdateInput = updateForEntry;

        function getEntryByUID(){
            scope.Dispatch(ExampleUI.signals.boxEntryRequest, boxInput.uid, updateForEntry);
        }

        function modifyEntry(){
            scope.Dispatch(ExampleUI.signals.boxInputModify, boxInput.uid, boxInput);
        }

        function removeEntry(){
            scope.Dispatch(ExampleUI.signals.boxInputRemove, boxInput.uid);
        }

        
        var controller = {
            Random: randomInput,
            Insert: complete,
            Abort: abort,
            Modify: modifyEntry,
            Remove: removeEntry,
        };
        Object.defineProperties(controller, {
            Width: {
                get: function(){ return boxInput.width;},
                set: function(value){ boxInput.width = value; inputUpdate();}
            },
            Length: {
                get: function(){ return boxInput.length;},
                set: function(value){ boxInput.length = value; inputUpdate();}
            },
            Height: {
                get: function(){ return boxInput.height;},
                set: function(value){ boxInput.height = value; inputUpdate();}
            },
            Label: {
                get: function(){ return boxInput.label;},
                set: function(value){ boxInput.label = value; inputUpdate();}
            },
            Weight: {
                get: function(){ return boxInput.weight;},
                set: function(value){ boxInput.weight = value; inputUpdate();}
            },
            Quantity: {
                get: function(){ return boxInput.quantity;},
                set: function(value){ boxInput.quantity = value; inputUpdate();}
            },
            ValidOrientations: {
                get: function(){ return boxInput.validOrientations;},
                set: function(value){ boxInput.validOrientations = value; inputUpdate();},
            },
            StackingCapacity: {
                get: function(){ return boxInput.stackingCapacity;},
                set: function(value){ boxInput.stackingCapacity = value; inputUpdate();}
            },
            Grounded: {
                get: function(){ return boxInput.grounded;},
                set: function(value){ boxInput.grounded = value; inputUpdate();}
            },

            EntryUID: {
                get: function(){ return boxInput.uid;},
                set: function(value){ boxInput.uid = value; getEntryByUID();}
            }
        });

        var inputFolder = this.gui.addFolder('Cargo input');
        inputFolder.add(controller, 'Random');

        var infoFolder = inputFolder.addFolder('Info');
        infoFolder.open();
        infoFolder.add(controller, 'Label');
        infoFolder.add(controller, 'Weight');
        infoFolder.add(controller, 'Quantity');

        var constraintsFolder = inputFolder.addFolder('Constraints');
        constraintsFolder.open();
        constraintsFolder.add(controller, 'ValidOrientations');
        constraintsFolder.add(controller, 'StackingCapacity');
        constraintsFolder.add(controller, 'Grounded');

        var dimensionsFolder = inputFolder.addFolder('Dimensions');
        dimensionsFolder.open();
        dimensionsFolder.add(controller, 'Width' , boxRange.w[0], boxRange.w[1]).step(1/p).listen();
        dimensionsFolder.add(controller, 'Length', boxRange.l[0], boxRange.l[1]).step(1/p).listen();
        dimensionsFolder.add(controller, 'Height', boxRange.h[0], boxRange.h[1]).step(1/p).listen();

        var modifyFolder = inputFolder.addFolder('Modify entry');
        var entryUID = modifyFolder.add(controller, 'EntryUID');
        entryUID.onChange(getEntryByUID);
        modifyFolder.add(controller, 'Modify');
        modifyFolder.add(controller, 'Remove');

        inputFolder.add(controller, 'Insert');
        inputFolder.add(controller, 'Abort');
    //    inputFolder.add(controller, 'onSelect');
        return inputFolder;
    }

    static get signals(){
        return signals;
    }
    static dataArray(args) {
        let logPane = document.getElementById('tbody');
        logPane.innerHTML = testArray(args) + logPane.innerHTML;

    }
}

houdini.init();
var counter = 0;


function testArray(args) {
    
    let result = '';
    console.log(args);
    if (counter != 0) 
    {
        if(counter <= 15)
        {
            // console.log(args);
            // var color = args.Color;
            // if(color == '25500')
            // {
            //     bgcolor = 'lightblue';
            //     warna = 'biru';
            // }
            // if(color == '44366')
            // {
            //     bgcolor = 'lightgreen';
            //     warna = 'hijau';
                
            // }
            // if(color == '12316672')
            // {
            //     bgcolor = 'lightyellow';
            //     warna = 'kuning';
                
            // }
            // if(color == '16717202')
            // {
            //     bgcolor = 'red';
            //     warna = 'merah';
            // }

            result += "<tr><td>" + counter + "</td>" +
            "<td id="+args.Uuid+" style=color:blue onClick=selectBlocks("+"'"+args.Uuid+"'"+");>" + args.Name + "</td>" +
            "<td>" + args.Grup + "</td>" +
            "<td>" + args.Dim1 + "</td>" +
            "<td>" + args.Dim2 + "</td>" +
            "<td>" + args.Dim3 + "</td>" +
            "<td bgcolor="+bgcolor+">" + warna + "</td>" +
            "<td>" + args.Jumlah + "</td>" +
            "<td>" + args.Deskripsi + "</td> </tr>";
        }
    }
    counter++;
    return result;
    
}

function argsToString(args){
    let result = '';
    args.forEach(arg => {
        if(typeof arg === typeofObject){
            try{
                let i = jsonCount++;
                let jsonString = JSON.stringify(arg, function(key, value) {
                    // limit precision of floats
                    if (typeof value === 'number') {
                        return parseFloat(value.toFixed(2));
                    }
                    return value;
                });
                let jsonObject = JSON.parse(jsonString);
                jsonObjects.push(jsonObject);

                let label = 'object...';result += '<a class="collapse-toggle" data-collapse href="#json-view-' + i + '" style="color: #b5d5ff; cursor: pointer;">' + label + '</a>';
                
                result += '<div class="collapse" id="json-view-' + i + '"></div>'; 
            }
            catch(err){
                // console.warn(err);
                // result += arg;
            }
        }
        else{
            result += arg;
        }
        result += ' ';
    });
    return result;
}