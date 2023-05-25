/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 * Version      Date          Author            
 * 2.1         10.05.2021     Joaquim Sousa
 */
define(['N/currentRecord', 'N/search', 'N/record', 'N/runtime'], function (currentRecord, search, record, runtime) {
    var myDropzone = ''

    function pageInit(context) {
        try {
            var url_deployment = null;
            var myEnvType = runtime.envType

            if (myEnvType === runtime.EnvType.PRODUCTION) {
                url_deployment = 'https://5641302.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2029&deploy=1'
            } else {
                url_deployment = 'https://5641302-sb1.app.netsuite.com/app/site/hosting/scriptlet.nl?script=2029&deploy=1'
            };
            var userObj = runtime.getCurrentUser();
            var id_employee = userObj.id;
          
            var principal = document.getElementById("principal");
            var idTable = document.getElementById("id_table");
            idTable.className = 'tableClassNormal';
            var btn = document.getElementById("bnt");
            btn.className = 'btnNormal';
            var myDiv = document.getElementById("myDiv");
            var myLoading = document.getElementById("loading");
            var loadingContainer = document.getElementById("idloadingContainer");
            var idDiv = document.getElementById("myId");
            var form = document.createElement("form");
            var tagP = document.createElement("p");
            tagP.innerText = "Arraste os arquivos aqui para upload e clique no botão upload";
            tagP.id = 'idP';
            form.className = 'dropzone';
            form.id = 'my-awesome-dropzone';
            form.action = '/file-upload';
            idDiv.appendChild(form);
            idDiv.appendChild(tagP);
            var divNova = document.createElement("div");
            var conteudoNovo = document.createTextNode("Olá, cumprimentos!");
            divNova.appendChild(conteudoNovo);
            //principal.appendChild(btn);

            var myRecord = currentRecord.get();
            var id = myRecord.id;
            getData(myRecord.type, id, url_deployment);

            if (!id) {
                id = 'temporario_'+id_employee;
            };

            myDropzone = new Dropzone("div#myId", {
                url: '/app/site/hosting/scriptlet.nl?script=2029&deploy=1' + "&record=" + myRecord.type + "&id=" + id,
                autoProcessQueue: false,
                //uploadMultiple: true,
                parallelUploads: 100,
                maxFiles: 100,
            });

            myDropzone.on("uploadprogress", function (file, progress, bytesSent) {
                myDiv.className = 'loader';
                myLoading.className = 'loading';
                loadingContainer.className = 'loadingContainer';
                document.querySelector("#myId > div").remove();

            });

            myDropzone.on("queuecomplete", function (file) {
                setTimeout(
                    getData(myRecord.type, id, url_deployment),
                    200);

                myDiv.className = 'loaderfinish';
                myLoading.className = 'loadingfinish';
                loadingContainer.className = 'loadingContainerFinish';

            });

            myDropzone.on("error", function (file,) {
                console.log('Error')
                console.log(file)
            });

        } catch (e) {
                      alert('Erro cliente ' + e);

            var myDiv = document.getElementById("myDiv");
            var myLoading = document.getElementById("loading");
            myDiv.className = 'loaderfinish';
            myLoading.className = 'loadingfinish';
            log.error('Error', e);
            console.log(e)
        };
    };
    return {
        pageInit: pageInit,
    };
});