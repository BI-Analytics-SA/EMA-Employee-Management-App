<GlobalFunctions>
  <SqlQueryUnified
    id="getRows"
    query={include("./lib/getRows.sql", "string")}
    queryTimeout="10001"
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    resourceTypeOverride=""
    runWhenModelUpdates={false}
    warningCodes={[]}
  />
  <SqlQueryUnified
    id="addImageURL"
    isMultiplayerEdited={false}
    query={include("./lib/addImageURL.sql", "string")}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    resourceTypeOverride=""
    runWhenModelUpdates={false}
    warningCodes={[]}
  >
    <Event
      id="564a6516"
      event="success"
      method="clearValue"
      params={{ ordered: [] }}
      pluginId="imageInput1"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="c6bc2adf"
      event="success"
      method="trigger"
      params={{ ordered: [] }}
      pluginId="getRows"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="1a956a5e"
      event="success"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "success" },
                { title: "Done" },
                { description: "Image Uploaded" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="24fb75fe"
      event="success"
      method="back"
      params={{ ordered: [] }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="d7a56b64"
      event="failure"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "error" },
                { description: "addImageURL Failed" },
                { title: "SQL Image Link" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
  </SqlQueryUnified>
  <S3Query
    id="s3UploadImage"
    actionType="upload"
    bucketName="cararaimages"
    isMultiplayerEdited={false}
    resourceDisplayName="AmazonS3"
    resourceName="c0fa3daa-d840-433c-87fa-4caa5265cca5"
    resourceTypeOverride=""
    runWhenModelUpdates={false}
    uploadData="{{ imageInput1.value[0] }}"
    uploadFileName="idbooks/{{ collectionView1.selectedItem.ID }}-{{ new Date() }}"
    uploadFileType="jpg"
    useRawUploadFileType={true}
  >
    <Event
      id="19cc6777"
      event="success"
      method="run"
      params={{
        ordered: [
          {
            src: "addImageURL.trigger(\n{\n        additionalScope: {\n            emplFK: collectionView1.selectedItem.ID,\n            URL: s3UploadImage.data.signedUrl.split('?')[0],\n            s3fileName:s3UploadImage.data.fileName\n        }\n}\n);",
          },
        ],
      }}
      pluginId=""
      type="script"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="26ef0806"
      event="failure"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "error" },
                { description: "There was an error with s3UploadImage" },
                { title: "s3 Upload Error" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
  </S3Query>
  <SqlQueryUnified
    id="employeeDetails"
    query={include("./lib/employeeDetails.sql", "string")}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    resourceTypeOverride=""
    warningCodes={[]}
  />
  <S3Query
    id="s3DeleteImage"
    actionType="delete"
    bucketName="cararaimages"
    fileKey="{{ collectionView1.selectedItem.FileName }}"
    isMultiplayerEdited={false}
    resourceDisplayName="AmazonS3"
    resourceName="c0fa3daa-d840-433c-87fa-4caa5265cca5"
    resourceTypeOverride=""
    runWhenModelUpdates={false}
  >
    <Event
      id="71d51331"
      event="success"
      method="trigger"
      params={{ ordered: [] }}
      pluginId="deleteImageURL"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="fc80115b"
      event="failure"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "error" },
                { title: "S3 Upload Failed" },
                { description: "Image not Uploaded" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
  </S3Query>
  <SqlQueryUnified
    id="deleteImageURL"
    isMultiplayerEdited={false}
    query={include("./lib/deleteImageURL.sql", "string")}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    resourceTypeOverride=""
    runWhenModelUpdates={false}
    warningCodes={[]}
  >
    <Event
      id="e414c1a9"
      event="success"
      method="trigger"
      params={{ ordered: [] }}
      pluginId="getRows"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="0a11a1f6"
      event="success"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "success" },
                { title: "Done" },
                { description: "Delete Successful" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="de7b2332"
      event="failure"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "error" },
                { title: "SQL Image Table Error" },
                { description: "SQL Link not Deleted!" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
  </SqlQueryUnified>
  <SqlQueryUnified
    id="submitEmplDetailsDev"
    actionType="UPDATE_BY"
    changesetIsObject={true}
    changesetObject={
      '{{ {\n    ...formComponent3.data,\n    "Date_Registered":datePickerDateRegistered.value === ""?null:datePickerDateRegistered.value,\n    "Title":selectTitle.value ,\n    "DateOfBirth":datePickerDateOfBirth.value,\n      "Gender":selectGender.value,\n      "EthnicGroup":selectEthnicGroup.value,\n      "DepartmentWorked":selectDepartmentWorked.value,\n      "DeptGroup":selectDeptGroup.value,\n      "ResSuburb":selectResSuburb.value,\n      "ResCity":selectResCity.value,\n      "ResPostCode":selectResPostCode.value\n   } }}'
    }
    editorMode="gui"
    filterBy={
      '[{"key":"ID","value":"{{ employeeDetails.data.ID }}","operation":"="}]'
    }
    isMultiplayerEdited={false}
    notificationDuration={4.5}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    runWhenModelUpdates={false}
    showSuccessToaster={false}
    tableName="dbo.TMEW_CA_EmplDetails"
  >
    <Event
      id="7d3d0bf7"
      event="success"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "success" },
                { title: "Done" },
                { description: "Empl Saved" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="4d91d6df"
      event="success"
      method="backToRoot"
      params={{ ordered: [] }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="fa0db6b9"
      event="success"
      method="trigger"
      params={{ ordered: [] }}
      pluginId="getRows"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="26de11e9"
      event="failure"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "error" },
                { title: "Error" },
                { description: "Error Saving Empl !" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
  </SqlQueryUnified>
  <SqlQueryUnified
    id="addEmpl"
    actionType="INSERT"
    changeset={'[{"key":"IDNumber","value":""}]'}
    changesetIsObject={true}
    changesetObject={
      '{{ {\n    ...formComponent4.data,\n    "Date_Registered":datePickerDateRegistered2.value === ""?null:datePickerDateRegistered2.value,\n    "Title":selectTitle2.value ,\n    "DateOfBirth":datePickerDateOfBirth2.value,\n      "Gender":selectGender2.value,\n      "EthnicGroup":selectEthnicGroup2.value,\n      "DepartmentWorked":selectDepartmentWorked2.value,\n      "DeptGroup":selectDeptGroup2.value,\n      "ResSuburb":selectResSuburb2.value,\n      "ResCity":selectResCity2.value,\n      "ResPostCode":selectResPostCode2.value\n   } }}'
    }
    editorMode="gui"
    filterBy={
      '[{"key":"ID","value":"{{ employeeDetails.data.ID }}","operation":"="}]'
    }
    isMultiplayerEdited={false}
    notificationDuration={4.5}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    runWhenModelUpdates={false}
    showSuccessToaster={false}
    tableName="dbo.TMEW_CA_EmplDetails"
  >
    <Event
      id="b11a896a"
      event="success"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "success" },
                { title: "Done" },
                { description: "Employee Added" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="1de975b0"
      event="success"
      method="backToRoot"
      params={{ ordered: [] }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="11cc9c38"
      event="success"
      method="trigger"
      params={{ ordered: [] }}
      pluginId="getRows"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="1a488e78"
      event="failure"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "error" },
                { title: "Error" },
                { description: "Error with Adding Empl" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
  </SqlQueryUnified>
  <SqlQueryUnified
    id="deleteEmplDetails"
    isMultiplayerEdited={false}
    query={include("./lib/deleteEmplDetails.sql", "string")}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    resourceTypeOverride=""
    runWhenModelUpdates={false}
    warningCodes={[]}
  >
    <Event
      id="d32ea646"
      event="success"
      method="trigger"
      params={{ ordered: [] }}
      pluginId="deleteImageURL"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="6f465fcb"
      event="success"
      method="backToRoot"
      params={{ ordered: [] }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="f21e9cfa"
      event="failure"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "error" },
                { title: "Empl Details Error" },
                { description: "Unable to delete from Empl Details" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
  </SqlQueryUnified>
  <SqlQueryUnified
    id="emplContract"
    notificationDuration={4.5}
    query={include("./lib/emplContract.sql", "string")}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    showSuccessToaster={false}
    showUpdateSetValueDynamicallyToggle={false}
    updateSetValueDynamically={true}
    warningCodes={[]}
  />
  <SqlQueryUnified
    id="submitContract"
    actionType="INSERT"
    changesetIsObject={true}
    changesetObject="{{ form1.data }}"
    editorMode="gui"
    isMultiplayerEdited={false}
    notificationDuration={4.5}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    runWhenModelUpdates={false}
    showSuccessToaster={false}
    tableName="dbo.TMEW_CA_EmpIContracts"
  >
    <Event
      id="4e6d8921"
      event="success"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "success" },
                { title: "Complete" },
                { description: "Contract Details Submitted!" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="f0afc192"
      event="success"
      method="backToRoot"
      params={{ ordered: [] }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="4fd579e8"
      event="success"
      method="reset"
      params={{ ordered: [] }}
      pluginId="form1"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="46af1e8b"
      event="success"
      method="clearValue"
      params={{ ordered: [] }}
      pluginId="signature2"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="61d629c0"
      event="success"
      method="resetValue"
      params={{ ordered: [] }}
      pluginId="selTraining_Cont2"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="43ec0a73"
      event="success"
      method="resetValue"
      params={{ ordered: [] }}
      pluginId="selDeptGroup_Cont2"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="f47adc09"
      event="success"
      method="resetValue"
      params={{ ordered: [] }}
      pluginId="selShift_Cont2"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="21113450"
      event="success"
      method="resetValue"
      params={{ ordered: [] }}
      pluginId="selShiftAlloc_Cont2"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="9acc5109"
      event="failure"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "error" },
                { title: "Error" },
                { description: "Error in Submitting Contract Details" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
  </SqlQueryUnified>
  <SqlQueryUnified
    id="submitContractEmplDetails"
    actionType="UPDATE_BY"
    changeset={
      '[{"key":"EmplNo","value":"{{ textInput85.value }}"},{"key":"Training","value":"{{ selTraining_Cont2.value }}"},{"key":"Shift","value":"{{ selShift_Cont2.value }}"},{"key":"ShiftAlloc","value":"{{ selShiftAlloc_Cont2.value }}"},{"key":"DeptGroup","value":"{{ selDeptGroup_Cont2.value }}"},{"key":"DateEngaged","value":"{{ datePicker4.value }}"}]'
    }
    editorMode="gui"
    filterBy={
      '[{"key":"ID","value":"{{ employeeDetails.data.ID[0] }}","operation":"="}]'
    }
    isMultiplayerEdited={false}
    notificationDuration={4.5}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    runWhenModelUpdates={false}
    showSuccessToaster={false}
    showUpdateSetValueDynamicallyToggle={false}
    tableName="dbo.TMEW_CA_EmplDetails"
    updateSetValueDynamically={true}
  >
    <Event
      id="f1f703bc"
      event="success"
      method="trigger"
      params={{ ordered: [] }}
      pluginId="submitContract"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="82ec8db2"
      event="failure"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "error" },
                { title: "ERROR" },
                {
                  description:
                    "Error updating Empl Details with Contract Info.",
                },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
  </SqlQueryUnified>
  <S3Query
    id="s3UploadSignature"
    actionType="upload"
    bucketName="cararaimages"
    isMultiplayerEdited={false}
    notificationDuration={4.5}
    resourceDisplayName="AmazonS3"
    resourceName="c0fa3daa-d840-433c-87fa-4caa5265cca5"
    runWhenModelUpdates={false}
    showSuccessToaster={false}
    uploadData="{{ signature2.value }}"
    uploadFileName="signatures/{{ textInput86.value }}-{{ new Date() }}"
    uploadFileType="image/png"
    useRawUploadFileType={true}
  >
    <Event
      id="6a9d67c4"
      event="success"
      method="setValue"
      params={{
        ordered: [
          { value: "{{ s3UploadSignature.data.signedUrl.split('?')[0] }}" },
        ],
      }}
      pluginId="textInput87"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="20c36219"
      event="success"
      method="setValue"
      params={{ ordered: [{ value: "{{ s3UploadSignature.data.fileName }}" }] }}
      pluginId="textInput88"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="01a2ef16"
      event="success"
      method="setDisabled"
      params={{ ordered: [{ disabled: false }] }}
      pluginId="formButton9"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="e93e6e22"
      event="failure"
      method="showNotification"
      params={{
        ordered: [
          {
            options: {
              ordered: [
                { notificationType: "error" },
                { title: "Error" },
                { description: "There was an Error Uploading the Signature" },
              ],
            },
          },
        ],
      }}
      pluginId=""
      type="util"
      waitMs="0"
      waitType="debounce"
    />
  </S3Query>
  <S3Query
    id="s3UploadSignatureMedical"
    actionType="upload"
    bucketName="cararaimages"
    isMultiplayerEdited={false}
    resourceDisplayName="AmazonS3"
    resourceName="c0fa3daa-d840-433c-87fa-4caa5265cca5"
    runWhenModelUpdates={false}
    uploadData="{{ signature3.value }}"
    uploadFileName="signatures/{{ Empl_Details_FK.value }}-{{ new Date() }}"
    uploadFileType="image/png"
    useRawUploadFileType={true}
  >
    <Event
      id="811ef6e7"
      event="success"
      method="setValue"
      params={{
        map: {
          value: "{{ s3UploadSignatureMedical.data.signedUrl.split('?')[0] }}",
        },
      }}
      pluginId="Empl_Signature_URL"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="91adf584"
      event="success"
      method="setValue"
      params={{
        map: { value: "{{ s3UploadSignatureMedical.data.fileName }}" },
      }}
      pluginId="Empl_Signature_FileName"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="8f370d7f"
      event="success"
      method="setDisabled"
      params={{ map: { disabled: false } }}
      pluginId="signature4"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
  </S3Query>
  <S3Query
    id="s3UploadSignatureMedicalEdit"
    actionType="upload"
    bucketName="cararaimages"
    isMultiplayerEdited={false}
    resourceDisplayName="AmazonS3"
    resourceName="c0fa3daa-d840-433c-87fa-4caa5265cca5"
    runWhenModelUpdates={false}
    uploadData="{{ signature5.value }}"
    uploadFileName="signatures/{{ Empl_Details_FK2.value }}-{{ new Date() }}"
    uploadFileType="image/png"
    useRawUploadFileType={true}
  >
    <Event
      id="e5de4dcb"
      event="success"
      method="setValue"
      params={{
        map: {
          value:
            "{{ s3UploadSignatureMedicalEdit.data.signedUrl.split('?')[0] }}",
        },
      }}
      pluginId="Empl_Sig_URL_Edit"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="4c1b60f9"
      event="success"
      method="setValue"
      params={{
        map: { value: "{{ s3UploadSignatureMedicalEdit.data.fileName }}" },
      }}
      pluginId="Empl_Sig_FileName_Edit"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="7cd6afb4"
      event="success"
      method="setDisabled"
      params={{ map: { disabled: false } }}
      pluginId="signature6"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
  </S3Query>
  <S3Query
    id="s3UploadSignatureMedicalNurse"
    actionType="upload"
    bucketName="cararaimages"
    isMultiplayerEdited={false}
    resourceDisplayName="AmazonS3"
    resourceName="c0fa3daa-d840-433c-87fa-4caa5265cca5"
    runWhenModelUpdates={false}
    uploadData="{{ signature4.value }}"
    uploadFileName="signatures/nurse-{{ new Date() }}"
    uploadFileType="image/png"
    useRawUploadFileType={true}
  >
    <Event
      id="def39fc9"
      event="success"
      method="setValue"
      params={{
        map: {
          value:
            "{{ s3UploadSignatureMedicalNurse.data.signedUrl.split('?')[0] }}",
        },
      }}
      pluginId="Nurse_Signature_URL"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="ca94223c"
      event="success"
      method="setValue"
      params={{
        map: { value: "{{ s3UploadSignatureMedicalNurse.data.fileName }}" },
      }}
      pluginId="Nurse_Signature_FileName"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="d401c0ad"
      event="success"
      method="setDisabled"
      params={{ map: { disabled: false } }}
      pluginId="formButton10"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
  </S3Query>
  <S3Query
    id="s3UploadSignatureMedicalNurseEdit"
    actionType="upload"
    bucketName="cararaimages"
    isMultiplayerEdited={false}
    resourceDisplayName="AmazonS3"
    resourceName="c0fa3daa-d840-433c-87fa-4caa5265cca5"
    runWhenModelUpdates={false}
    uploadData="{{ signature6.value }}"
    uploadFileName="signatures/nurse-{{ new Date() }}"
    uploadFileType="image/png"
    useRawUploadFileType={true}
  >
    <Event
      id="d7300328"
      event="success"
      method="setValue"
      params={{
        map: {
          value:
            "{{ s3UploadSignatureMedicalNurseEdit.data.signedUrl.split('?')[0] }}",
        },
      }}
      pluginId="Nurse_Sig_URL_Edit"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="30b72599"
      event="success"
      method="setValue"
      params={{
        map: { value: "{{ s3UploadSignatureMedicalNurseEdit.data.fileName }}" },
      }}
      pluginId="Nurse_Sig_FileName_Edit"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="75dd7982"
      event="success"
      method="setDisabled"
      params={{ map: { disabled: false } }}
      pluginId="formButton11"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
  </S3Query>
  <SqlQueryUnified
    id="form1SubmitToDboTmewCaEmpIContracts"
    actionType="INSERT"
    changesetIsObject={true}
    changesetObject="{{ form1.data }}"
    editorMode="gui"
    notificationDuration={4.5}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    runWhenModelUpdates={false}
    showSuccessToaster={false}
    tableName="dbo.TMEW_CA_EmpIContracts"
  />
  <SqlQueryUnified
    id="medical_questions"
    query={include("./lib/medical_questions.sql", "string")}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    warningCodes={[]}
  />
  <SqlQueryUnified
    id="createNewMedicalQuest"
    actionType="INSERT"
    changeset={
      '[{"key":"Illness_Last_two_Years","value":"{{  Illness_Last_two_Years.value}}"},{"key":"Empl_Details_FK","value":"{{  Empl_Details_FK.value}}"},{"key":"Illness_Last_two_Years_detail","value":"{{  Illness_Last_two_Years_Detail.value}}"},{"key":"Treated_TB","value":"{{  Treated_TB.value}}"},{"key":"Treated_TB_Detail","value":"{{  Treated_TB_Detail.value}}"},{"key":"On_Treatment_Now","value":"{{  On_Treatment_Now.value}}"},{"key":"HepatitusA","value":"{{  HepatitusA.value}}"},{"key":"HepatitusB","value":"{{  HepatitusB.value}}"},{"key":"Blood_Pressure","value":"{{  Blood_Pressure.value}}"},{"key":"Diabetes","value":"{{  Diabetes.value}}"},{"key":"Long_Term","value":"{{  Long_Term.value}}"},{"key":"Long_Term_Detail","value":"{{  Long_Term_Detail.value}}"},{"key":"Reason_Cant_Complete","value":"{{  Reason_Cant_Complete.value}}"},{"key":"Empl_Signature_URL","value":"{{ Empl_Signature_URL.value}}"},{"key":"Empl_Signature_FileName","value":"{{ Empl_Signature_FileName.value}}"},{"key":"Nurse_Signature_URL","value":"{{ Nurse_Signature_URL.value }}"},{"key":"Nurse_Signature_FileName","value":"{{ Nurse_Signature_FileName.value }}"},{"key":"Notes","value":"{{ Notes.value }}"}]'
    }
    changesetObject="{{ formComponent6.data }}"
    editorMode="gui"
    isMultiplayerEdited={false}
    notificationDuration={4.5}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    runWhenModelUpdates={false}
    showSuccessToaster={false}
    tableName="dbo.TMEW_CA_MedicalQuest"
  >
    <Event
      id="2eefa180"
      event="success"
      method="trigger"
      params={{}}
      pluginId="medical_questions"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="922047c6"
      event="success"
      method="back"
      params={{}}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="ec155418"
      event="success"
      method="clearValue"
      params={{}}
      pluginId="signature3"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="e845f658"
      event="success"
      method="clearValue"
      params={{}}
      pluginId="signature4"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
  </SqlQueryUnified>
  <SqlQueryUnified
    id="EditMedicalQuest"
    actionType="UPDATE_BY"
    changeset={
      '[{"key":"Illness_Last_two_Years","value":"{{Illness_Last_two_Years2.value}}"},{"key":"Illness_Last_two_Years_detail","value":"{{Illness_Last_two_Years_Detail2.value}}"},{"key":"Treated_TB","value":"{{Treated_TB2.value}}"},{"key":"Treated_TB_Detail","value":"{{Treated_TB_Detail2.value}}"},{"key":"On_Treatment_Now","value":"{{On_Treatment_Now2.value}}"},{"key":"HepatitusA","value":"{{HepatitusA2.value}}"},{"key":"HepatitusB","value":"{{HepatitusB2.value}}"},{"key":"Blood_Pressure","value":"{{Blood_Pressure2.value}}"},{"key":"Diabetes","value":"{{Diabetes2.value}}"},{"key":"Long_Term","value":"{{Long_Term2.value}}"},{"key":"Long_Term_Detail","value":"{{Long_Term_Detail2.value}}"},{"key":"Reason_Cant_Complete","value":"{{Reason_Cant_Complete2.value}}"},{"key":"Empl_Signature_URL","value":"{{ Empl_Sig_URL_Edit.value }}"},{"key":"Empl_Signature_FileName","value":"{{ Empl_Sig_FileName_Edit.value }}"},{"key":"Nurse_Signature_URL","value":"{{ Nurse_Sig_URL_Edit.value }}"},{"key":"Nurse_Signature_FileName","value":"{{ Nurse_Sig_FileName_Edit.value }}"},{"key":"Notes","value":"{{ Notes2.value }}"}]'
    }
    changesetObject="{{ formComponent6.data }}"
    editorMode="gui"
    filterBy={
      '[{"key":"Empl_Details_FK","value":"{{ employeeDetails.data.ID }}","operation":"="}]'
    }
    isMultiplayerEdited={false}
    notificationDuration={4.5}
    resourceDisplayName="TMEW-Azure Server- Admin"
    resourceName="c4969dca-4816-4f6e-9d58-e09cc766889e"
    runWhenModelUpdates={false}
    showSuccessToaster={false}
    tableName="dbo.TMEW_CA_MedicalQuest"
  >
    <Event
      id="4e87f5a7"
      event="success"
      method="back"
      params={{}}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="8796f10e"
      event="success"
      method="clearValue"
      params={{}}
      pluginId="signature5"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="70bff45f"
      event="success"
      method="clearValue"
      params={{}}
      pluginId="signature6"
      type="widget"
      waitMs="0"
      waitType="debounce"
    />
  </SqlQueryUnified>
</GlobalFunctions>
