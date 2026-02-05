<Container
  id="body3"
  align="center"
  cornerType="square"
  justify="flex-start"
  layout="column"
  padding={{ object: {} }}
  widthGrowFactor={1}
>
  <TextArea
    id="textInput26"
    formDataKey="IDNumber"
    label="Id number"
    maxLength="{{ textInput26.value[0].length === 13?0:13 }}"
    minLength="{{ textInput26.value[0].length === 13?0:13 }}"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <Select
    id="selectTitle"
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
    id="textInput27"
    autoCapitalize="characters"
    formDataKey="Initials"
    label="Initials"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="textInput28"
    autoCapitalize="characters"
    formDataKey="FirstName"
    label="First name"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="textInput29"
    autoCapitalize="characters"
    formDataKey="SecondName"
    label="Second name"
    minLines={1}
    placeholder="Enter value"
  />
  <TextArea
    id="textInput30"
    autoCapitalize="characters"
    formDataKey="LastName"
    label="Last name"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="textInput31"
    autoCapitalize="characters"
    formDataKey="knownAs"
    label="Known as"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <DatePicker
    id="datePickerDateOfBirth"
    displayTimeZone="local"
    formDataKey=""
    label="Date of birth"
    mode="date"
    required={true}
    value="{{ employeeDetails.data.DateOfBirth[0] }}"
    valueTimeZone="local"
  />
  <Select
    id="selectGender"
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
    id="selectEthnicGroup"
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
    id="textInput33"
    formDataKey="CellNumber"
    label="Cell number"
    maxLength="{{ textInput33.value[0].length === 10?0:10 }}"
    minLength="{{ textInput33.value[0].length === 10?0:10 }}"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="textInput35"
    formDataKey="AlternativeNumber"
    label="Alternative number"
    maxLength="{{ textInput35.value[0].length === 10?0:10 }}"
    minLength="{{ textInput35.value[0].length === 10?0:10 }}"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <Select
    id="selectDepartmentWorked"
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
    id="selectDeptGroup"
    formDataKey=""
    label="Dept group"
    labelPosition="top"
    labels="['CAPS1', 'CAPS2', 'CAPS4']"
    placeholder="Select an option"
    value="{{ employeeDetails.data.DeptGroup[0] }}"
    values="['CAPS1', 'CAPS2', 'CAPS4']"
  />
  <TextArea
    id="textInput36"
    formDataKey="TaxNumber"
    label="Tax number"
    minLines={1}
    placeholder="Enter value"
  />
  <TextArea
    id="textInput37"
    autoCapitalize="characters"
    formDataKey="ResStreetNo"
    label="Res street no"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <TextArea
    id="textInput38"
    autoCapitalize="characters"
    formDataKey="ResStreetName"
    label="Res street name"
    minLines={1}
    placeholder="Enter value"
    required={true}
  />
  <Select
    id="selectResSuburb"
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
    id="selectResCity"
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
    id="selectResPostCode"
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
    id="textInput39"
    autoCapitalize="characters"
    formDataKey="Certificate"
    label="Certificate"
    minLines={1}
    placeholder="Enter value"
  />
  <Container
    id="container4"
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
      id="button3"
      hidden={'{{ datePickerDateRegistered.value !== "" }}'}
      iconBefore="bold/interface-edit-write-2"
      size="large"
      submitTargetId="formComponent3"
      text="Register Empl"
    >
      <Event
        id="39473d6c"
        event="click"
        method="run"
        params={{
          ordered: [
            {
              src: "await datePickerDateRegistered.setValue(new Date(new Date().setUTCHours(0,0,0,0)).toISOString().replace('+0200','Z'));",
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
      id="formButton4"
      iconBefore="bold/interface-content-save"
      size="large"
      submit={true}
      submitTargetId="formComponent3"
      text="Save"
    />
  </Container>
  <DatePicker
    id="datePickerDateRegistered"
    displayTimeZone="local"
    formDataKey=""
    hidden="true"
    label="Date Registered"
    mode="date"
    value="{{ employeeDetails.data.Date_Registered[0] }}"
    valueTimeZone="local"
  />
</Container>
