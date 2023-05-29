/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([], function () {

    function pageInit(context) {
        definePlaceHolder('custrecord_pf_solicitacao_field_obs', 'Digite a alteração...')
    }

    const definePlaceHolder = (field, text) => {
        var campo = document.getElementById(field);
        campo.setAttribute('placeholder', text);
    }

    return {
        pageInit: pageInit
    }
});
