/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define([], function () {

    function pageInit(context) {
        try {
            definePlaceHolder('custrecord_pf_solicitacao_field_obs', 'Digite a alteração...')
        } catch (e) {
            console.error(`Erro: ${e}`)
        }
    }

    function fieldChanged(context) {
        try {
            const fieldId = context.fieldId
            const CurrentRecord = context.currentRecord
            var banco = CurrentRecord.getField('custrecord_pf_solicitacao_field_bancos')
            var oracle = CurrentRecord.getField('custrecord_pf_solicitacao_field_oracle')
            var valueBanco = CurrentRecord.getValue('custrecord_pf_solicitacao_field_bancos')
            var valueOracle = CurrentRecord.getValue('custrecord_pf_solicitacao_field_oracle')
            console.log(`ValueBanco: ${valueBanco}`)
            console.log(`valueOracle: ${valueOracle}`)
            console.log(`fieldId: ${fieldId}`)

            if (fieldId == banco.id && valueBanco) {
                console.log('Desabilitei Oracle')
                oracle.isDisabled = true
            }
            if (fieldId == banco.id && valueBanco == ''){
                console.log('Habilitei Oracle')
                oracle.isDisabled = false
            }

            if (fieldId == oracle.id && valueOracle) {
                console.log('Desabilitei Banco')
                banco.isDisabled = true
            }
            if (fieldId == oracle.id && !valueOracle){
                console.log('Habilitei Banco')
                banco.isDisabled = false
            }
            
        } catch (e) {
            console.error(`Erro: ${e}`)
        }
    }

    const definePlaceHolder = (field, text) => {
        var campo = document.getElementById(field);
        campo.setAttribute('placeholder', text);
    }

    return {
        pageInit: pageInit,
        fieldChanged: fieldChanged
    }
});
