<Container
  id="body9"
  align="center"
  cornerType="square"
  justify="flex-start"
  layout="column"
  widthGrowFactor={1}
>
  <TextArea
    id="Empl_Details_FK"
    autoCorrect={true}
    formDataKey=""
    hidden="true"
    label="Empl_Details_FK"
    minLines={1}
    placeholder="Enter value"
    required={true}
    value="{{employeeDetails.data.ID[0]}}"
  />
  <Select
    id="Illness_Last_two_Years"
    formDataKey=""
    label="HAVE YOU HAD ANY ILLNESS IN THE LAST TWO YEARS?"
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="No"
    values="['Yes', 'No']"
  />
  <TextArea
    id="Illness_Last_two_Years_Detail"
    autoCorrect={true}
    formDataKey=""
    hidden={'{{ Illness_Last_two_Years.value === "No" }}'}
    label="PLEASE SUPPLY DETAILS:"
    minLines={1}
    placeholder="Enter value"
  />
  <Select
    id="Treated_TB"
    formDataKey=""
    label="HAVE YOU BEEN TREATED FOR TB BEFORE? "
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="No"
    values="['Yes', 'No']"
  />
  <TextArea
    id="Treated_TB_Detail"
    autoCorrect={true}
    formDataKey=""
    hidden={'{{ Treated_TB.value === "No" }}'}
    label="WHEN WAS YOUR LAST TREATMENT?"
    minLines={1}
    placeholder="Enter value"
  />
  <Select
    id="On_Treatment_Now"
    formDataKey=""
    label="ARE YOU ON TEATMENT FOR TB AT PRESENT: "
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="No"
    values="['Yes', 'No']"
  />
  <Select
    id="HepatitusA"
    formDataKey=""
    label="HAVE YOU HAD HEPATITUS A BEFORE: "
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="No"
    values="['Yes', 'No']"
  />
  <Select
    id="HepatitusB"
    formDataKey=""
    label="HAVE YOU HAD HEPATITUS B BEFORE: "
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="No"
    values="['Yes', 'No']"
  />
  <Select
    id="Blood_Pressure"
    formDataKey=""
    label="DO YOU SUFFER FROM BLOOD PRESSURE PROBLEMS?"
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="No"
    values="['Yes', 'No']"
  />
  <Select
    id="Diabetes"
    formDataKey=""
    label="DO YOU SUFFER FROM DIABETES?"
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="No"
    values="['Yes', 'No']"
  />
  <Select
    id="Long_Term"
    formDataKey=""
    label="ARE YOU ON ANY KIND OF LONG TERM / CHRONIC MEDICATION OR TREATMENT?"
    labelPosition="top"
    labels="['Yes', 'No']"
    placeholder="Select an option"
    required={true}
    value="No"
    values="['Yes', 'No']"
  />
  <TextArea
    id="Long_Term_Detail"
    autoCorrect={true}
    formDataKey=""
    hidden={'{{ Long_Term.value === "No" }}'}
    label="PLEASE SUPPLY DETAILS OF THE TREATMENT AND THE PROBLEM:"
    minLines={1}
    placeholder="Enter value"
  />
  <TextArea
    id="Reason_Cant_Complete"
    autoCorrect={true}
    formDataKey=""
    hidden=""
    label="DO YOU KNOW OF ANY REASON, MEDICAL OR PERSONAL, THAT WILL PREVENT YOU FROM COMPLETING A SIX MONTH FIXED TERM CONTRACT?(I.E. MEDICAL TREATMENT, PREGNANCY OR CHRONIC DISEASE)"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="Notes"
    autoCorrect={true}
    formDataKey=""
    label="Notes:"
    minLines="3
"
    placeholder="Enter value"
  />
  <Signature
    id="signature3"
    _disableForcedOrientation={true}
    _forceUseObjectUrl={true}
    _useObjectUrl={true}
    instructions="Sign your name using your finger"
    label="Empl Signature"
    placeholder="Sign your name"
  >
    <Event
      id="0aa56d3d"
      event="capture"
      method="trigger"
      params={{}}
      pluginId="s3UploadSignatureMedical"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
  </Signature>
  <Signature
    id="signature4"
    _disableForcedOrientation={true}
    _forceUseObjectUrl={true}
    _useObjectUrl={true}
    instructions="Sign your name using your finger"
    label="Nurse Signature"
    placeholder="Sign your name"
  >
    <Event
      id="8af50abc"
      event="capture"
      method="trigger"
      params={{}}
      pluginId="s3UploadSignatureMedicalNurse"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
  </Signature>
  <Spacer id="spacer4" height={8} />
  <TextArea
    id="Empl_Signature_URL"
    autoCorrect={true}
    formDataKey=""
    hidden="true"
    label="Empl Sig URL"
    minLines={1}
    placeholder="Enter value"
    value="{{ medical_questions.data.Empl_Signature_URL[0] }}"
  />
  <TextArea
    id="Empl_Signature_FileName"
    autoCorrect={true}
    formDataKey=""
    hidden="true"
    label="Empl Sig File Name"
    minLines={1}
    placeholder="Enter value"
    value="{{ medical_questions.data.Empl_Signature_FileName[0] }}"
  />
  <TextArea
    id="Nurse_Signature_URL"
    autoCorrect={true}
    formDataKey=""
    hidden="true"
    label="Nurse Sig URL"
    minLines={1}
    placeholder="Enter value"
    value="{{medical_questions.data.Nurse_Signature_URL[0]}}"
  />
  <TextArea
    id="Nurse_Signature_FileName"
    autoCorrect={true}
    formDataKey=""
    hidden="true"
    label="Nurse Sig File Name"
    minLines={1}
    placeholder="Enter value"
    value="{{ medical_questions.data.Nurse_Signature_FileName[0] }}"
  />
</Container>
