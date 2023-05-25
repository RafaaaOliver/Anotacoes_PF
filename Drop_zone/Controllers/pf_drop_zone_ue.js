/**
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 * Version      Date           Author
 * 2.1          04.11.2021     Joaquim Sousa
 */
define(['N/file', 'N/ui/serverWidget', 'N/search', 'N/record', '../Models/ns-aws-s3.js', 'N/runtime'], function (file, serverWidget, search, record, AWS, runtime) {
    function beforeLoad(context) {


      log.debug('passo',context.form);
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.EDIT) {
          
try{

  
            context.form.addFieldGroup({
                id: 'fieldgroupid',
                label: 'Anexos'
            });
  

            context.form.addFieldGroup({
                id: 'fieldoutros',
                label: 'Outros'
            });

            context.form.addField({
                id: 'custpage_htmlfield3',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'HTML Image',
                container: 'fieldoutros'
            });

            var contentDocumentDataTable = file.load({ id: 684078 }).getContents();
  
log.debug('contentDocumentDataTable',contentDocumentDataTable);
  
            var html_data_table = context.form.addField({
                id: 'custpage_htmlfield2',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'HTML Image',
                container: 'fieldgroupid'
            }).updateLayoutType({
                layoutType: serverWidget.FieldLayoutType.OUTSIDEBELOW
            });


            html_data_table.defaultValue = contentDocumentDataTable;

            var htmlDropzone = context.form.addField({
                id: 'custpage_htmlfield1',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'HTML Dropzone',
                container: 'fieldgroupid'
            });
  
log.debug('htmlDropzone',htmlDropzone);

            htmlDropzone.defaultValue = '\
            <div id="idloadingContainer" class="loadingContainer1">\
            <div style="display: flex; align-items: end">\
            <div id="myDiv" class="loader1"></div>\
            </div>\
            <div id="principal" class="principalClass">\
            <div id="myId" class="container"></div>\
            </div>';

            var htmlImage = context.form.addField({
                id: 'custpage_htmlfield',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'HTML Image',
            });
log.debug('htmlImage',htmlImage);
            var contentDocument = file.load({ id: 684077 }).getContents();
log.debug('contentDocument',contentDocument);
            htmlImage.defaultValue = contentDocument;

  
}catch(e){
  log.error('erro',e);
}
        }

        if (context.type == context.UserEventType.VIEW) {

            context.form.addFieldGroup({
                id: 'fieldgroupid',
                label: 'Anexos'
            });

            var contentDocumentDataTable = file.load({ id: 690595 }).getContents(); // Data Table

            var html_data_table = context.form.addField({
                id: 'custpage_htmlfield2',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'HTML Image',
                container: 'fieldgroupid'
            })

            html_data_table.defaultValue = contentDocumentDataTable;

        }
    }

    function afterSubmit(context) {

        if (context.type == context.UserEventType.CREATE) {
            try {


                var userObj = runtime.getCurrentUser();
            var id_employee = userObj.id;
            var id_temporario = 'temporario_'+id_employee;
                search.create({
                    type: 'customrecord_pf_document_netsuite_dropz',
                    filters: [
                        search.createFilter({ name: 'custrecord_pf_dropzone_id', operator: search.Operator.IS, values: id_temporario }),
                        search.createFilter({ name: 'custrecord_pf_dropzone_type_record', operator: search.Operator.IS, values: context.newRecord.type }),
                        search.createFilter({ name: 'custrecord_pf_dropzone_employee', operator: search.Operator.IS, values: userObj.id }),
                    ],
                    columns: [
                        search.createColumn({ name: 'custrecord_pf_dropzone_key' }),
                        search.createColumn({ name: 'custrecord_pf_body_file_dropzone' }),
                        search.createColumn({ name: 'custrecord_id_file' }),
                    ]
                }).run().getRange({
                    start: 0,
                    end: 1000
                }).forEach(function (result) {
                    var key = result.getValue(result.columns[0]).split('/');
                    var keyFormat = key[0] + "/" + key[1] + "/" + key[2] + "/" + key[3] + "/" + context.newRecord.id + "/" + key[5];


                    record.submitFields({
                        type: 'customrecord_pf_document_netsuite_dropz',
                        id: result.id,
                        values: {
                            custrecord_pf_dropzone_id: context.newRecord.id,
                            custrecord_pf_dropzone_key: keyFormat,
                        },
                        options: {
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        }
                    });

                    var record_credenciais_aws = record.load({
                        type: 'customrecord_pf_credentials_aws',
                        id: 1,
                        isDynamic: true
                    });

                    var accessKeyId = record_credenciais_aws.getValue({ fieldId: 'custrecord_pf_accesskeyid' });
                    var secretAccessKey = record_credenciais_aws.getValue({ fieldId: 'custrecord_pf_secretaccesskey' });

                    var options = {
                        region: 'us-east-1',
                        accessKeyId: accessKeyId,
                        secretAccessKey: secretAccessKey,
                    }


                    var s3 = new AWS.S3(options);

                    var contentDocument = file.load({ id: result.getValue(result.columns[2]) }).getContents();

                    s3.putObject({
                        Bucket: 'pmfo-ns-docs',
                        ContentEncoding: 'UTF-8',
                        Key: keyFormat,
                        Body: contentDocument,
                    }, function (err, data) {
                        if (err) {
                            log.error('error', err.stack);
                        } else {
                            log.debug('Sucess', data);

                            record.submitFields({
                                type: 'customrecord_pf_document_netsuite_dropz',
                                id: result.id,
                                values: {
                                    custrecord_pf_status_dropzone: 'Enviado',

                                },
                                options: {
                                    enableSourcing: false,
                                    ignoreMandatoryFields: true
                                }
                            });

                        }
                    });

                    file.delete({
                        id: result.getValue(result.columns[2])
                    });
                });
            } catch (error) {
                log.error('error', error);
            }
        }
    }
    return {
        beforeLoad: beforeLoad,
        afterSubmit: afterSubmit
    };
}
);