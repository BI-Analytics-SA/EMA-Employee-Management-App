<Screen
  id="formScreen"
  _customShortcuts={[]}
  _hashParams={[]}
  _searchParams={[]}
  events={[
    {
      ordered: [
        { event: "load" },
        { type: "widget" },
        { method: "setDisabled" },
        { pluginId: "formButton9" },
        { targetId: null },
        { params: { ordered: [] } },
        { waitType: "debounce" },
        { waitMs: "0" },
        { id: "cb4575e5" },
      ],
    },
  ]}
  title="form"
  uuid="e5d42c1d-c3da-4596-becb-43097c7a4944"
>
  <Frame
    id="$main8"
    enableFullBleed={false}
    isHiddenOnDesktop={false}
    isHiddenOnMobile={false}
    padding="8px 12px"
    sticky={null}
    type="main"
  />
  <Form
    id="form1"
    layout="column"
    padding={{ object: {} }}
    requireValidation={true}
    resetAfterSubmit={true}
    scroll={true}
    showBody={true}
    showFooter={true}
    showHeader={true}
  >
    <Text
      id="formTitle8"
      markdown={true}
      value="#### Capture Contract Details"
    />
    <Include src="./body8.rsx" />
    <Button
      id="formButton9"
      size="large"
      submit={true}
      submitTargetId="form1"
      text="Submit"
    />
    <Event
      id="05aa4731"
      event="submit"
      method="trigger"
      params={{ ordered: [] }}
      pluginId="submitContractEmplDetails"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
  </Form>
</Screen>
