<Container
  id="body8"
  align="center"
  cornerType="square"
  justify="flex-start"
  layout="column"
  padding={{ ordered: [{ left: 0 }, { right: 0 }, { top: 0 }, { bottom: 0 }] }}
  widthGrowFactor={1}
>
  <TextArea
    id="textInput83"
    formDataKey="Name_Surname"
    label="Name and Surname"
    minLines={1}
    placeholder="Enter value"
    required={true}
    value="{{ employeeDetails.data.FirstName[0] }} {{ employeeDetails.data.LastName[0] }}"
  />
  <TextArea
    id="textInput84"
    formDataKey="ID_Number"
    label="Id number"
    minLines={1}
    placeholder="Enter value"
    required={true}
    value="{{ employeeDetails.data.IDNumber[0] }}"
  />
  <DatePicker
    id="datePicker3"
    displayTimeZone="local"
    formDataKey="Signed_Date"
    label="Signed date"
    mode="date"
    required={true}
    value="{{ moment(new Date()).format('YYYY-MM-DD') }}"
    valueTimeZone="local"
  />
  <DatePicker
    id="datePicker4"
    displayTimeZone="local"
    formDataKey="Start_Date"
    label="Start date"
    mode="date"
    required={true}
    valueTimeZone="local"
  />
  <Select
    id="select2"
    formDataKey="Boots_Amount"
    label="Boots amount"
    labelPosition="top"
    labels="['New Boots Ladies', 'New Boots Men ', '2nd Hand Boots Ladies', '2nd Hand Boots Men']"
    placeholder="Select an option"
    required={true}
    value=""
    values="['152', '195', '70', '90']"
  />
  <TextArea
    id="textInput85"
    formDataKey="EmplNo"
    label="Empl no"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="textInput86"
    formDataKey="Season"
    label="Season"
    minLines={1}
    placeholder="eg. 2024"
    required={true}
  />
  <Select
    id="selTraining_Cont2"
    formDataKey=""
    label="Training"
    labelPosition="top"
    labels="['True', 'False']"
    placeholder="Select an option"
    required={true}
    value="False"
    values="['True', 'False']"
  />
  <Select
    id="selDeptGroup_Cont2"
    formDataKey=""
    label="Dept Group"
    labelPosition="top"
    labels="['CAPS1', 'CAPS2', 'CAPS4']"
    placeholder="Select an option"
    required={true}
    value=""
    values="['CAPS1', 'CAPS2', 'CAPS4']"
  />
  <Select
    id="selShift_Cont2"
    formDataKey=""
    label="Shift"
    labelPosition="top"
    labels="['A', 'B', 'C']"
    placeholder="Select an option"
    required={true}
    value=""
    values="['A', 'B', 'C']"
  />
  <Select
    id="selShiftAlloc_Cont2"
    formDataKey=""
    label="Shift Alloc"
    labelPosition="top"
    labels="['Adhoc', 'C1G', 'C1RG','C1T','C1S','C1RO','C1C','C2PC','C2PL','C2PM','C2SLL','C2SLL','C2CTL','C4PL','C4PC','C4PM','C4TC','COR']"
    placeholder="Select an option"
    required={true}
    value=""
    values="['Adhoc', 'C1G', 'C1RG','C1T','C1S','C1RO','C1C','C2PC','C2PL','C2PM','C2SLL','C2SLL','C2CTL','C4PL','C4PC','C4PM','C4TC','COR']"
  />
  <Signature
    id="signature2"
    _disableForcedOrientation={true}
    _forceUseObjectUrl={true}
    _useObjectUrl={true}
    instructions="Sign your name using your finger"
    label="Signature"
    placeholder="Sign your name"
  >
    <Event
      id="4c1f6b8c"
      event="capture"
      method="trigger"
      params={{
        ordered: [
          {
            options: {
              object: {
                onSuccess: null,
                onFailure: null,
                additionalScope: null,
              },
            },
          },
        ],
      }}
      pluginId="s3UploadSignature"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
  </Signature>
  <TextArea
    id="textInput87"
    formDataKey="Sig_URL"
    hidden="true"
    label="Sig_URL"
    minLines={1}
    placeholder="Enter value"
  />
  <TextArea
    id="textInput88"
    formDataKey="Sig_FileName"
    hidden="true"
    label="Sig_FileName"
    minLines={1}
    placeholder="Enter value"
  />
  <NumberInput
    id="numberInput8"
    formDataKey="Empl_FK"
    hidden="true"
    label="Empl fk"
    placeholder={0}
    required={true}
    stepSize={1}
    value="{{ employeeDetails.data.ID[0] }}"
  />
</Container>
