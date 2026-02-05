<Screen
  id="newContractScreen"
  _customShortcuts={[]}
  _hashParams={[]}
  _searchParams={[]}
  events={[
    {
      ordered: [
        { event: "load" },
        { type: "widget" },
        { method: "setDisabled" },
        { pluginId: "formButton6" },
        { targetId: null },
        { params: { ordered: [] } },
        { waitType: "debounce" },
        { waitMs: "0" },
        { id: "c5e16387" },
      ],
    },
  ]}
  title="New Contract"
  uuid="9b3a0494-2abe-4a49-941c-6f6fa8f83e98"
>
  <Frame
    id="$main7"
    enableFullBleed={false}
    isHiddenOnDesktop={false}
    isHiddenOnMobile={false}
    padding="8px 12px"
    sticky={null}
    type="main"
  />
  <Form
    id="formComponent5"
    enableFullBleed="false"
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
      id="formTitle5"
      markdown={true}
      value="#### Capture Contract Details"
    />
    <Include src="./body5.rsx" />
    <Button
      id="formButton6"
      loading="{{ submitContract.isFetching }}"
      size="large"
      submit={true}
      submitTargetId="formComponent5"
      text="Submit Contract Details"
    />
    <Event
      id="58fd1e9d"
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
