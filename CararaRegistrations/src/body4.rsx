<Container
  id="body4"
  align="center"
  cornerType="square"
  justify="flex-start"
  layout="column"
  padding={{ object: {} }}
  widthGrowFactor={1}
>
  <TextArea
    id="textInput40"
    formDataKey="IDNumber"
    label="Id number"
    maxLength="13"
    minLength="13"
    minLines={1}
    placeholder="Enter value"
    required={true}
    value="{{ textInput1.value }}"
  />
  <Select
    id="selectTitle2"
    formDataKey=""
    label="Title"
    labelPosition="top"
    labels="['MISS', 'MR']"
    placeholder="Select an option"
    required={true}
    value="{{ employeeDetails.data.Title[0] }}"
    values="['MISS', 'MR']"
  />
  <TextArea
    id="textInput41"
    autoCapitalize="characters"
    disabled=""
    formDataKey="Initials"
    label="Initials"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="textInput42"
    autoCapitalize="characters"
    formDataKey="FirstName"
    label="First name"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="textInput43"
    autoCapitalize="characters"
    formDataKey="SecondName"
    label="Second name"
    minLines={1}
    placeholder="Enter value"
  />
  <TextArea
    id="textInput44"
    autoCapitalize="characters"
    formDataKey="LastName"
    label="Last name"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="textInput45"
    autoCapitalize="characters"
    formDataKey="knownAs"
    label="Known as"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <DatePicker
    id="datePickerDateOfBirth2"
    displayTimeZone="local"
    formDataKey=""
    label="Date of birth"
    mode="date"
    required={true}
    value="{{ employeeDetails.data.DateOfBirth[0] }}"
    valueTimeZone="local"
  />
  <Select
    id="selectGender2"
    formDataKey=""
    label="Gender"
    labelPosition="top"
    labels="['M', 'F']"
    placeholder="Select an option"
    required={true}
    value="{{ employeeDetails.data.Gender[0] }}"
    values="['M', 'F']"
  />
  <Select
    id="selectEthnicGroup2"
    formDataKey=""
    label="Ethnic group"
    labelPosition="top"
    labels="['Asian', 'Coloured', 'White' ,'Indian' ,'Black']"
    placeholder="Select an option"
    required={true}
    value="{{ employeeDetails.data.EthnicGroup[0] }}"
    values="['A', 'C', 'W' ,'I' ,'B']"
  />
  <TextArea
    id="textInput47"
    formDataKey="CellNumber"
    label="Cell number"
    maxLength="10"
    minLength="10"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="textInput49"
    formDataKey="AlternativeNumber"
    label="Alternative number"
    maxLength="10"
    minLength="10"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <Select
    id="selectDepartmentWorked2"
    formDataKey=""
    label="Department worked"
    labelPosition="top"
    labels="['Adhoc', 'C1G', 'C1RG','C1T','C1S','C1RO','C1C','COR','C2PC','C2PL','C2PM','C2SLL','C2SLL','C2CTL','C4PL','C4PC','C4PM','C4TC','NEW']"
    placeholder="Select an option"
    required={true}
    value="{{ employeeDetails.data.DepartmentWorked[0] }}"
    values="['Adhoc', 'C1G', 'C1RG','C1T','C1S','C1RO','C1C','COR','C2PC','C2PL','C2PM','C2SLL','C2SLL','C2CTL','C4PL','C4PC','C4PM','C4TC','NEW']"
  />
  <Select
    id="selectDeptGroup2"
    formDataKey=""
    label="Dept group"
    labelPosition="top"
    labels="['CAPS1', 'CAPS2', 'CAPS4']"
    placeholder="Select an option"
    value="{{ employeeDetails.data.DeptGroup[0] }}"
    values="['CAPS1', 'CAPS2', 'CAPS4']"
  />
  <TextArea
    id="textInput50"
    formDataKey="TaxNumber"
    label="Tax number"
    minLines={1}
    placeholder="Enter value"
  />
  <TextArea
    id="textInput51"
    formDataKey="ResStreetNo"
    label="Res street no"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="textInput52"
    autoCapitalize="characters"
    formDataKey="ResStreetName"
    label="Res street name"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <Select
    id="selectResSuburb2"
    formDataKey=""
    label="Res suburb"
    labelPosition="top"
    labels="['GRAHAMSTOWN', 'ALEXANDRIA', 'KING WILLIAMS TOWN']"
    placeholder="Select an option"
    required={true}
    value="{{ employeeDetails.data.ResSuburb[0] }}"
    values="['GRAHAMSTOWN', 'ALEXANDRIA', 'KING WILLIAMS TOWN']"
  />
  <Select
    id="selectResCity2"
    formDataKey=""
    label="Res city"
    labelPosition="top"
    labels="['GRAHAMSTOWN', 'ALEXANDRIA', 'KING WILLIAMS TOWN']"
    placeholder="Select an option"
    required={true}
    value="{{ employeeDetails.data.ResCity[0] }}"
    values="['GRAHAMSTOWN', 'ALEXANDRIA', 'KING WILLIAMS TOWN']"
  />
  <Select
    id="selectResPostCode2"
    formDataKey=""
    label="Res post code"
    labelPosition="top"
    labels="['6139', '6185', '5601']"
    placeholder="Select an option"
    required={true}
    value="{{ employeeDetails.data.ResPostCode[0] }}"
    values="['6139', '6185', '5601']"
  />
  <TextArea
    id="textInput53"
    autoCapitalize="characters"
    formDataKey="Certificate"
    label="Certificate"
    minLines={1}
    placeholder="Enter value"
  />
  <Container
    id="container5"
    align="center"
    cornerType="square"
    gap={8}
    justify="center"
    layout="row"
    padding={{
      ordered: [{ left: 0 }, { right: 0 }, { top: 0 }, { bottom: 0 }],
    }}
    showBody={true}
    widthGrowFactor={1}
  >
    <Button
      id="button5"
      hidden={'{{ datePickerDateRegistered2.value !== "" }}'}
      iconBefore="bold/interface-edit-write-2"
      size="large"
      submitTargetId="formComponent4"
      text="Register Empl"
    >
      <Event
        id="7ed75445"
        event="click"
        method="run"
        params={{
          ordered: [
            {
              src: "await datePickerDateRegistered2.setValue(new Date(new Date().setUTCHours(0,0,0,0)).toISOString().replace('+0200','Z'));",
            },
          ],
        }}
        pluginId=""
        type="script"
        waitMs="0"
        waitType="debounce"
      />
    </Button>
    <Button
      id="formButton5"
      iconBefore="bold/interface-content-save"
      size="large"
      submit={true}
      submitTargetId="formComponent4"
      text="Save"
    />
  </Container>
  <DatePicker
    id="datePickerDateRegistered2"
    displayTimeZone="local"
    formDataKey=""
    hidden="true"
    label="Date Registered"
    mode="date"
    value="{{ employeeDetails.data.Date_Registered[0] }}"
    valueTimeZone="local"
  />
</Container>
