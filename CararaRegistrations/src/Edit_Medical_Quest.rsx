<Screen
  id="Edit_Medical_Quest"
  _customShortcuts={[]}
  _hashParams={[]}
  _searchParams={[]}
  browserTitle={null}
  events={[
    {
      method: "setDisabled",
      params: {},
      targetId: null,
      pluginId: "formButton11",
      waitType: "debounce",
      event: "load",
      type: "widget",
      id: "01661a0d",
      waitMs: "0",
    },
    {
      method: "setDisabled",
      params: {},
      targetId: null,
      pluginId: "signature6",
      waitType: "debounce",
      event: "load",
      type: "widget",
      id: "363355a8",
      waitMs: "0",
    },
  ]}
  title="Edit Medical Questionnaire"
  urlSlug="New_Medical_Quest2"
  uuid="8e8f70c8-2fc9-4dcd-989c-d61899e37e3c"
>
  <Frame
    id="$main9"
    enableFullBleed={false}
    isHiddenOnDesktop={false}
    isHiddenOnMobile={false}
    padding="8px 12px"
    type="main"
  />
  <Form
    id="formComponent7"
    enableFullBleed="false"
    initialData="{{ medical_questions.data }}"
    layout="column"
    requireValidation={true}
    resetAfterSubmit={true}
    scroll={true}
    showBody={true}
    showFooter={true}
    showHeader={true}
  >
    <Include src="./body10.rsx" />
    <Button
      id="formButton11"
      size="large"
      submit={true}
      submitTargetId="formComponent7"
      text="Edit Record"
    />
    <Event
      id="583613a7"
      event="submit"
      method="trigger"
      params={{}}
      pluginId="EditMedicalQuest"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
  </Form>
</Screen>
