<Container
  id="body10"
  align="center"
  cornerType="square"
  justify="flex-start"
  layout="column"
  widthGrowFactor={1}
>
  <TextArea
    id="Empl_Details_FK2"
    autoCorrect={true}
    formDataKey=""
    hidden="true"
    label="Empl_Details_FK"
    minLines={1}
    placeholder="Enter value"
    required={true}
    value="{{ medical_questions.data.Empl_Details_FK[0] }}"
  />
  <Text id="formTitle10" markdown={true} value="#### Edit" />
  <Select
    id="Illness_Last_two_Years2"
    formDataKey=""
    label="HAVE YOU HAD ANY ILLNESS IN THE LAST TWO YEARS?"
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="{{ medical_questions.data.Illness_Last_two_Years[0] }}"
    values="['Yes', 'No']"
  />
  <TextArea
    id="Illness_Last_two_Years_Detail2"
    autoCorrect={true}
    formDataKey=""
    hidden=""
    label="PLEASE SUPPLY DETAILS:"
    minLines={1}
    placeholder="Enter value"
    value="{{ medical_questions.data.Illness_Last_two_Years_detail[0] }}"
  />
  <Select
    id="Treated_TB2"
    formDataKey=""
    label="HAVE YOU BEEN TREATED FOR TB BEFORE? "
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="{{ medical_questions.data.On_Treatment_Now[0] }}"
    values="['Yes', 'No']"
  />
  <TextArea
    id="Treated_TB_Detail2"
    autoCorrect={true}
    formDataKey=""
    hidden=""
    label="WHEN WAS YOUR LAST TREATMENT?"
    minLines={1}
    placeholder="Enter value"
    value="{{ medical_questions.data.Treated_TB_Detail[0] }}"
  />
  <Select
    id="On_Treatment_Now2"
    formDataKey=""
    label="ARE YOU ON TEATMENT FOR TB AT PRESENT: "
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="{{ medical_questions.data.On_Treatment_Now[0]}}"
    values="['Yes', 'No']"
  />
  <Select
    id="HepatitusA2"
    formDataKey=""
    label="HAVE YOU HAD HEPATITUS A BEFORE: "
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="{{ medical_questions.data.HepatitusA[0]}}"
    values="['Yes', 'No']"
  />
  <Select
    id="HepatitusB2"
    formDataKey=""
    label="HAVE YOU HAD HEPATITUS B BEFORE: "
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="{{ medical_questions.data.HepatitusB[0]}}"
    values="['Yes', 'No']"
  />
  <Select
    id="Blood_Pressure2"
    formDataKey=""
    label="DO YOU SUFFER FROM BLOOD PRESSURE PROBLEMS?"
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="{{ medical_questions.data.Blood_Pressure[0]}}"
    values="['Yes', 'No']"
  />
  <Select
    id="Diabetes2"
    formDataKey=""
    label="DO YOU SUFFER FROM DIABETES?"
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="{{medical_questions.data.Diabetes[0] }}"
    values="['Yes', 'No']"
  />
  <Select
    id="Long_Term2"
    formDataKey=""
    label="ARE YOU ON ANY KIND OF LONG TERM / CHRONIC MEDICATION OR TREATMENT?"
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="{{ medical_questions.data.Long_Term[0]}}"
    values="['Yes', 'No']"
  />
  <TextArea
    id="Long_Term_Detail2"
    autoCorrect={true}
    formDataKey=""
    hidden=""
    label="PLEASE SUPPLY DETAILS OF THE TREATMENT AND THE PROBLEM:"
    minLines={1}
    placeholder="Enter value"
    value="{{ medical_questions.data.Long_Term_Detail[0]}}"
  />
  <TextArea
    id="Reason_Cant_Complete2"
    autoCorrect={true}
    formDataKey=""
    hidden=""
    label="DO YOU KNOW OF ANY REASON, MEDICAL OR PERSONAL, THAT WILL PREVENT YOU FROM COMPLETING A SIX MONTH FIXED TERM CONTRACT?(I.E. MEDICAL TREATMENT, PREGNANCY OR CHRONIC DISEASE)"
    minLines={1}
    placeholder="Enter value"
    required={true}
    value="{{ medical_questions.data.Reason_Cant_Complete[0]}}"
  />
  <TextArea
    id="Notes2"
    autoCorrect={true}
    label="Notes:"
    minLines="3"
    placeholder="Enter value"
  />
  <Signature
    id="signature5"
    _disableForcedOrientation={true}
    _forceUseObjectUrl={true}
    _useObjectUrl={true}
    instructions="Sign your name using your finger"
    label="Empl Signature"
    placeholder="Sign your name"
  >
    <Event
      id="fa33f8df"
      event="capture"
      method="trigger"
      params={{}}
      pluginId="s3UploadSignatureMedicalEdit"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
  </Signature>
  <Signature
    id="signature6"
    _disableForcedOrientation={true}
    _forceUseObjectUrl={true}
    _useObjectUrl={true}
    instructions="Sign your name using your finger"
    label="Nurse Signature"
    placeholder="Sign your name"
  >
    <Event
      id="446b9de9"
      event="capture"
      method="trigger"
      params={{}}
      pluginId="s3UploadSignatureMedicalNurseEdit"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
  </Signature>
  <Spacer id="spacer2" height={12} />
  <TextArea
    id="Empl_Sig_URL_Edit"
    autoCorrect={true}
    formDataKey=""
    hidden="true"
    minLines={1}
    placeholder="Enter value"
    value="{{ medical_questions.data.Empl_Signature_URL[0] }}"
  />
  <TextArea
    id="Empl_Sig_FileName_Edit"
    autoCorrect={true}
    formDataKey=""
    hidden="true"
    minLines={1}
    placeholder="Enter value"
    value="{{ medical_questions.data.Empl_Signature_FileName[0] }}"
  />
  <TextArea
    id="Nurse_Sig_URL_Edit"
    autoCorrect={true}
    formDataKey=""
    hidden="true"
    minLines={1}
    placeholder="Enter value"
    value="{{medical_questions.data.Nurse_Signature_URL[0]}}"
  />
  <TextArea
    id="Nurse_Sig_FileName_Edit"
    autoCorrect={true}
    formDataKey=""
    hidden="true"
    minLines={1}
    placeholder="Enter value"
    value="{{ medical_questions.data.Nurse_Signature_FileName[0] }}"
  />
</Container>
