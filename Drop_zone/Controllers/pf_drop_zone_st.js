/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * Version      Date           Author
 * 2.1          04.11.2021     Joaquim Sousa
 */
define(['../Models/ns-aws-s3.js', 'N/encode', 'N/record', 'N/file', 'N/search', 'N/runtime', 'N/https'], function (AWS, encode, record, file, search, runtime, https) {
    function onRequest(context) {
        try {
            var userObj = runtime.getCurrentUser();
            var id_employee = userObj.id;
            var id_temporario = 'temporario_'+id_employee;
            if (context.request.method === 'GET') {

                try {
                    var idRecord = context.request.parameters.idRecord;
                    var exportar = context.request.parameters.exportarXML;

                    if (exportar == true) {
                        search.create({
                            type: 'customrecord_pf_document_netsuite_dropz',
                            filters: [
                                search.createFilter({ name: 'isinactive', operator: search.Operator.IS, values: false }),
                                search.createFilter({ name: 'custrecord_pf_status_inactive', operator: search.Operator.IS, values: 'Ativo' }),
                                search.createFilter({ name: 'custrecord_pf_dropzone_name_file', operator: search.Operator.ISNOTEMPETY }),
                            ],
                            columns: []
                        }).run().getRange({
                            start: 0,
                            end: 1000
                        }).forEach(function (result) {
                            var id = result.id;
                            context.response.write(JSON.stringify(id));

                        });
                    };

                    if (!!idRecord) {
                        search.create({
                            type: 'customrecordtype',
                            filters: [
                                search.createFilter({
                                    name: 'internalid', operator: search.Operator.IS,
                                    values: idRecord
                                }),
                            ],
                            columns: [
                                search.createColumn({ name: 'scriptid' }),
                            ]
                        }).run().getRange({
                            start: 0,
                            end: 1000
                        }).forEach(function (result) {
                            var id = result.getValue(result.columns[0]);
                            context.response.write(JSON.stringify(id));

                        });

                    }
                } catch (error) {
                    log.debug('error', error)
                }

                var key = context.request.parameters.key;
                var IdDocDropz = context.request.parameters.id;
                var record_type = context.request.parameters.record;
                var remove = context.request.parameters.delete;
                var idDropzone = context.request.parameters.idDropzone;
                var id = context.request.parameters.id;

                log.audit('context.request.parameters', context.request.parameters);


                if (!!key) {
                    try {

                        var recordDropzone = search.lookupFields({
                            type: 'customrecord_pf_document_netsuite_dropz',
                            id: key,
                            columns: ['custrecord_pf_dropzone_key']
                        });


                        chave = recordDropzone.custrecord_pf_dropzone_key
                        chave = chave.replace(/%27/g, "'");
                        log.audit('chave', chave);


                        var record_credenciais_aws = search.lookupFields({
                            type: 'customrecord_pf_credentials_aws',
                            id: 1,
                            columns: ['custrecord_pf_accesskeyid', 'custrecord_pf_secretaccesskey']
                        });

                        var accessKeyId_value = record_credenciais_aws.custrecord_pf_accesskeyid
                        var secretAccessKey_value = record_credenciais_aws.custrecord_pf_secretaccesskey
                        log.audit('accessKeyId_value', accessKeyId_value);
                        log.audit('secretAccessKey_value', secretAccessKey_value);

                        var options = {
                            region: 'us-east-1',
                            accessKeyId: accessKeyId_value,
                            secretAccessKey: secretAccessKey_value,
                        }

                        var s3 = new AWS.S3(options);

                        var params = { Bucket: 'pmfo-ns-docs', Key: chave, Expires: 60 };

                        var url = s3.getSignedUrl('getObject', params);
                        log.audit('url', url)

                        var nomes = chave.split('/');

                        var name_file = nomes[nomes.length - 1];

                        var aws_response = https.get({
                            url: url,
                            headers: {
                                Accept: "application/octet-stream"
                            }
                        });

                        log.audit("aws_response", aws_response.code)
                        if (aws_response.code == 200) {

                        log.audit("aws_response.body", aws_response.body)
                        name_file = name_file.replace(/%/g, "");

                        log.audit("name_file", name_file)

                            var temp = file.create({
                                name: name_file,
                                fileType: file.Type.ZIP,
                                contents: aws_response.body
                            });

                            context.response.writeFile(temp);
                        } else {
                            chave = encodeURI(chave);

                            var params = { Bucket: 'pmfo-ns-docs', Key: chave, Expires: 60 };

                            var url = s3.getSignedUrl('getObject', params);
                            log.debug('url', url);

                            var aws_response = https.get({
                                url: url,
                                headers: {
                                    Accept: "application/octet-stream"
                                }
                            });

                            if (aws_response.code == 403) {

                                var params = { Bucket: 'pmfo-ns-docs', Key: chave, Expires: 60 };
                                var url = s3.getSignedUrl('getObject', params);

                                var aws_response = https.get({
                                    url: url,
                                    headers: {
                                        Accept: "application/octet-stream"
                                    }
                                });

                                var temp = file.create({
                                    name: name_file,
                                    fileType: file.Type.ZIP,
                                    contents: aws_response.body
                                });

                            } else {
                                var temp = file.create({
                                    name: name_file,
                                    fileType: file.Type.ZIP,
                                    contents: aws_response.body
                                });
                            }

                            context.response.writeFile(temp);

                        }

                        var ip = context.request.headers['ns-client-ip'];

                        var userObj = runtime.getCurrentUser();
                        var id_employee = userObj.id;

                        var audti_download = record.create({
                            type: "customrecord_pf_audti_download",
                            isDynamic: true
                        });

                        audti_download.setValue({
                            fieldId: "custrecord_pf_name_file_audit",
                            value: name_file,
                            ignoreFieldChange: true
                        });

                        audti_download.setValue({
                            fieldId: "custrecord_pf_data_audit",
                            value: new Date(),
                            ignoreFieldChange: true
                        });

                        audti_download.setValue({
                            fieldId: "custrecord_pf_employee_audit",
                            value: id_employee,
                            ignoreFieldChange: true
                        });

                        audti_download.save({
                            enableSourcing: false,
                            ignoreMandatoryFields: true
                        });


                        return;

                    } catch (error) {
                        log.error('Error', error.message, error);
                    }
                } else if (!!IdDocDropz && !!record_type && !idDropzone) {
                    var parameters = new Array();
                    var IdDocDropz = context.request.parameters.id;
                    var record_type = context.request.parameters.record;

                    search.create({
                        type: 'customrecord_pf_document_netsuite_dropz',
                        filters: [
                            search.createFilter({
                                name: 'custrecord_pf_dropzone_id', operator: search.Operator.IS,
                                values: IdDocDropz
                            }),
                            search.createFilter({
                                name: 'custrecord_pf_dropzone_type_record', operator: search.Operator.IS,
                                values: record_type
                            }),
                            search.createFilter({
                                name: 'custrecord_pf_status_inactive', operator: search.Operator.IS,
                                values: 'Ativo'
                            })
                        ],
                        columns: [
                            search.createColumn({ name: 'custrecord_pf_dropzone_key' }),
                            search.createColumn({ name: 'custrecord_pf_dropzone_employee' }),
                            search.createColumn({ name: 'custrecord_pf_dropzone_date' }),
                            search.createColumn({ name: 'custrecord_pf_dropzone_name_file' }),
                            search.createColumn({ name: 'custrecord_pf_file_size_dropzone' }),
                        ]
                    }).run().getRange({
                        start: 0,
                        end: 1000
                    }).forEach(function (result) {
                        var chave = result.getValue(result.columns[0]);
                        var employee = result.getText(result.columns[1]);
                        var data = result.getValue(result.columns[2]);
                        var name_file = result.getValue(result.columns[3]);
                        var size = result.getValue(result.columns[4]);

                        // chave = chave.replace('+', '%2B')
                        // chave = chave.replace(/ /g, '+');
                        // chave = chave.replace(/%27/g, "'");

                        parameters.push({
                            urls: result.id,
                            key: name_file,
                            size: size,
                            date: data,
                            employee: employee,
                            status: 'Completo',
                            dateRemove: result.id //+ '&' + record_type + '&' + IdDocDropz
                        });

                    });

                    context.response.write(JSON.stringify(parameters));

                    return;

                }

                if (remove == 'true') {

                    record.submitFields({
                        type: 'customrecord_pf_document_netsuite_dropz',
                        id: id,
                        values: {
                            'custrecord_pf_status_inactive': 'Inativo',
                        }
                    });

                    var parameters = [
                        ({
                            id: id,
                            remove: remove
                        })
                    ];

                    context.response.write(JSON.stringify(parameters));
                }

            }
            if (context.request.method === 'POST') {
                var type_record = context.request.parameters.record;
                var id_record = context.request.parameters.id

                if (!!id_record) {
                    try {

                        var prossegue = true;

                        search.create({
                            type: 'customrecord_pf_document_netsuite_dropz',
                            filters: [
                                search.createFilter({ name: 'custrecord_pf_dropzone_name_file', operator: search.Operator.IS, values: context.request.files.file.name }),
                                search.createFilter({ name: 'custrecord_pf_dropzone_id', operator: search.Operator.IS, values: id_record }),
                                search.createFilter({ name: 'custrecord_pf_dropzone_type_record', operator: search.Operator.IS, values: type_record }),
                                search.createFilter({ name: 'custrecord_pf_status_inactive', operator: search.Operator.IS, values: 'Ativo' }),
                            ],
                            columns: []
                        }).run().getRange({
                            start: 0,
                            end: 1
                        }).forEach(function (result) {
                            id = result.id;
                            if (!!id) {
                                prossegue = false
                            }
                        });

                        if (prossegue == true) {
                            var sucessu = true;
                            var today = new Date();

                            var file_obj = context.request.files.file;
                            file_obj.folder = 473469;
                            var idFile = file_obj.save();

                            var contentDocument = file.load({ id: idFile }).getContents();

                            var record_credenciais_aws = record.load({
                                type: 'customrecord_pf_credentials_aws',
                                id: 1,
                                isDynamic: true
                            });

                            var accessKeyId = record_credenciais_aws.getValue({ fieldId: 'custrecord_pf_accesskeyid' });
                            var secretAccessKey = record_credenciais_aws.getValue({ fieldId: 'custrecord_pf_secretaccesskey' });

                            // var file_name = object[index].name;
                            var size = context.request.files.file.size;

                            var options = {
                                region: 'us-east-1',
                                accessKeyId: accessKeyId,
                                secretAccessKey: secretAccessKey,
                            }


                            var uri = 'dropzone/' + today.getFullYear() + '/' + (today.getMonth() + 1) + '/' + type_record + '/' + id_record + '/' + context.request.files.file.name;

                            var s3 = new AWS.S3(options);

                            if (id_record != id_temporario) {

                                s3.putObject({
                                    Bucket: 'pmfo-ns-docs',
                                    ContentEncoding: 'UTF-8',
                                    Key: uri,
                                    Body: contentDocument,
                                    //ContentType: 'application/pdf',
                                }, function (err, data) {
                                    if (err) {
                                        log.error('error', err.stack);
                                        sucessu = false
                                    } else {
                                        log.audit('Sucess', data);
                                        sucessu = true
                                    }
                                });

                            };

                            var document_netsuite = record.create({
                                type: "customrecord_pf_document_netsuite_dropz",
                                isDynamic: true
                            });

                            document_netsuite.setValue({
                                fieldId: "custrecord_pf_dropzone_id",
                                value: id_record,
                                ignoreFieldChange: true
                            });

                            if (id_record != id_temporario) {
                                document_netsuite.setValue({
                                    fieldId: "custrecord_pf_status_dropzone",
                                    value: 'Enviado',
                                    ignoreFieldChange: true
                                });

                            } else {
                                document_netsuite.setValue({
                                    fieldId: "custrecord_pf_status_dropzone",
                                    value: 'Pendente',
                                    ignoreFieldChange: true
                                });

                                document_netsuite.setValue({
                                    fieldId: "custrecord_id_file",
                                    value: idFile,
                                    ignoreFieldChange: true
                                });
                            }

                            document_netsuite.setValue({
                                fieldId: "custrecord_pf_dropzone_name_file",
                                value: context.request.files.file.name,
                                ignoreFieldChange: true
                            });

                            document_netsuite.setValue({
                                fieldId: "custrecord_pf_dropzone_key",
                                value: uri,
                                ignoreFieldChange: true
                            });

                            document_netsuite.setValue({
                                fieldId: "custrecord_pf_dropzone_type_record",
                                value: type_record,
                                ignoreFieldChange: true
                            });

                            document_netsuite.setValue({
                                fieldId: "custrecord_pf_dropzone_employee",
                                value: id_employee,
                                ignoreFieldChange: true
                            });

                            document_netsuite.setValue({
                                fieldId: "custrecord_pf_dropzone_date",
                                value: today,
                                ignoreFieldChange: true
                            });

                            document_netsuite.setValue({
                                fieldId: "custrecord_pf_file_size_dropzone",
                                value: size,
                                ignoreFieldChange: true
                            });

                            document_netsuite.setValue({
                                fieldId: "custrecord_pf_status_inactive",
                                value: 'Ativo',
                                ignoreFieldChange: true
                            });

                            id = document_netsuite.save({
                                enableSourcing: false,
                                ignoreMandatoryFields: true
                            });

                            if (id_record != id_temporario) {
                                file.delete({
                                    id: idFile
                                });
                            };

                        } else {
                            log.debug('Arquivo ja existe');
                        };
                    } catch (error) {
                        log.error('Error: ' + error.message, error);
                        return "Não foi possivel subir o arquivo";
                    }
                };
                return 'Upload com sucesso';
            };
        } catch (e) {
            log.error('Error: onRequest', e);
            throw e.message
        }
    }

    return { onRequest: onRequest };
});
