/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * Version      Date          Author            
 * 2.1          30.03.2021    Joaquim Sousa
 */
define(['N/record', 'N/search', 'N/render', 'N/email', 'N/file', 'N/format'], function (record, search, render, email, file, format) {

    function getInputData(context) {
        try {
            var params = new Array();

            var customrecordcarteiraadministradaSearchObj = search.create({
                type: "customrecordcarteiraadministrada",
                filters:
                    [
                        ["isinactive", "is", "F"],
                        "AND",
                        ["custrecordtipocarteiraclassificacaogesta", "noneof", "5"],
                        "AND",
                        ["custrecorddataatatualizacaopl", "after", "daysago30"]
                    ],
                columns:
                    [
                        search.createColumn({
                            name: "custentityassessorprincipal",
                            join: "CUSTRECORDCARTADMCLIENTE",
                            label: "Executivo de Relacionamento Principal"
                        }),
                        search.createColumn({ name: "custrecordcarteiraadmassessor", label: "Assessor" }),
                        search.createColumn({ name: "custrecordcartadmcliente", label: "Cliente" }),
                        search.createColumn({
                            name: "name",
                            sort: search.Sort.ASC,
                            label: "Nome"
                        }),
                        search.createColumn({ name: "custrecordcarteiraconsolidadora", label: "Carteira Consolidadora" }),
                        search.createColumn({ name: "custrecordtipodecarteira", label: "Tipo de Carteira" }),
                        search.createColumn({ name: "custrecordtipocarteiraclassificacaogesta", label: "Tipo Carteira Classificação Gestão" }),
                        search.createColumn({ name: "custrecordstatuscarteira", label: "Status" }),
                        search.createColumn({ name: "custrecordmoedacarteira", label: "Moeda (Oracle)" }),
                        search.createColumn({ name: "custrecordcartadmconsolidadora", label: "Consolidadora" }),
                        search.createColumn({ name: "custrecordcatadmoffshore", label: "OffShore" }),
                        search.createColumn({ name: "custrecordcartadmplbase", label: "PL Base" }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: " {custrecordcartadmplbase} * {custrecordtaxacambiocarteira}",
                            label: "PL Convertido"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "Case When {custrecordcatadmoffshore} = 'T' Then {custrecordcartadmplbase} * {custrecordtaxacambiocarteira} Else 0 End",
                            label: "PL OffShore"
                        }),
                        search.createColumn({
                            name: "formulacurrency",
                            formula: "Case When {custrecordcatadmoffshore} = 'F' Then {custrecordcartadmplbase} * {custrecordtaxacambiocarteira} Else 0 End",
                            label: "PL OnShore"
                        }),
                        search.createColumn({ name: "custrecorddataatatualizacaopl", label: "Data Atualização do PL" }),
                        search.createColumn({ name: "custrecordsistemaativo", label: "Sistema Ativo" }),
                        search.createColumn({ name: "custrecordtaxacambiocarteira", label: "Câmbio Atual" })
                    ]
            }).run().each(function (result) {

                var customer = result.getValue(result.columns[2]);
                var pl_total = parseFloat(result.getValue(result.columns[11]));
                var pl_offshore = parseFloat(result.getValue(result.columns[13]));
                var pl_onshore = parseFloat(result.getValue(result.columns[14]));

                var position = params.map(function (e) {
                    return e.customerid;
                }).indexOf(customer);

                if (position == -1) {
                    params.push({
                        customerid: eval(customer),
                        pl_total: pl_total,
                        pl_offshore: pl_offshore,
                        pl_onshore: pl_onshore
                    });

                };

                return true;
            });


            // search.load({
            //     id: 'customsearch2395'
            // }).run().getRange({
            //     start: 0,
            //     end: 1000
            // }).forEach(function (result) {
            //     var customer = result.getValue(result.columns[0]);
            //     var pl_total = parseFloat(result.getValue(result.columns[1]));
            //     var pl_offshore = parseFloat(result.getValue(result.columns[2]));
            //     var pl_onshore = parseFloat(result.getValue(result.columns[3]));

            //     var position = params.map(function (e) {
            //         return e.customerid;
            //     }).indexOf(customer);

            //     if (position == -1) {
            //         params.push({
            //             customerid: customer,
            //             pl_total: pl_total,
            //             pl_offshore: pl_offshore,
            //             pl_onshore: pl_onshore
            //         });
            //     };

            // });

            log.audit('params', params);
            log.debug('Total de clientes', params.length);

            return params;

        } catch (e) {
            log.error('Error getInputData', e);
        }
    }

    function map(context) {
        try {
            var value = JSON.parse(context.value);

            var record_customer = record.load({
                type: record.Type.CUSTOMER,
                id: value.customerid,
                isDynamic: true,
            });

            record_customer.setValue({ fieldId: 'custentity_pmfo_cliente_pltotal', value: value.pl_total });
            record_customer.setValue({ fieldId: 'custentity_pmfo_cliente_ploffshoretotal', value: value.pl_offshore });
            record_customer.setValue({ fieldId: 'custentity_pmfo_cl_plonshoretotal', value: value.pl_onshore });
            record_customer.setValue({ fieldId: 'custentitydtapuracaopl', value: new Date() });

            var recordId = record_customer.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });

            log.audit('recordId', recordId);

        } catch (e) {
            log.error('Error Map', e);
        }
    }

    return {
        getInputData: getInputData,
        map: map,
    };
});