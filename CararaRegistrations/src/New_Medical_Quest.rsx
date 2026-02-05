<Screen
  id="New_Medical_Quest"
  _customShortcuts={[]}
  _hashParams={[]}
  _searchParams={[]}
  browserTitle={null}
  events={[
    {
      method: "setDisabled",
      params: {},
      targetId: null,
      pluginId: "formButton10",
      waitType: "debounce",
      event: "load",
      type: "widget",
      id: "1270268a",
      waitMs: "0",
    },
    {
      method: "setDisabled",
      params: {},
      targetId: null,
      pluginId: "signature4",
      waitType: "debounce",
      event: "load",
      type: "widget",
      id: "d845a56a",
      waitMs: "0",
    },
  ]}
  title="Medical Questionnaire"
  urlSlug={null}
  uuid="b9129cbe-0bb5-4a4d-9922-7b2cd214bdda"
>
  <Form
    id="formComponent6"
    enableFullBleed="false"
    layout="column"
    requireValidation={true}
    resetAfterSubmit={true}
    scroll={true}
    showBody={true}
    showFooter={true}
    showHeader={true}
  >
    <Text id="formTitle9" markdown={true} value="#### Capture" />
    <Include src="./body9.rsx" />
    <Button
      id="formButton10"
      size="large"
      submit={true}
      submitTargetId="formComponent6"
      text="Submit"
    />
    <Event
      id="748509ee"
      event="submit"
      method="trigger"
      params={{}}
      pluginId="createNewMedicalQuest"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
  </Form>
</Screen>
