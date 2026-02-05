<Screen
  id="addEmplScreen"
  _customShortcuts={[]}
  _hashParams={[]}
  _searchParams={[]}
  title="Employee Details"
  uuid="0c34e2f6-4d38-4f92-9b98-ff6307a64a47"
>
  <Frame
    id="$main5"
    enableFullBleed={false}
    isHiddenOnDesktop={false}
    isHiddenOnMobile={false}
    padding="8px 12px"
    sticky={null}
    type="main"
  />
  <Form
    id="formComponent4"
    enableFullBleed="false"
    initialData=""
    layout="column"
    padding={{ object: {} }}
    requireValidation={true}
    resetAfterSubmit={true}
    scroll={true}
    showBody={true}
    showFooter={true}
    showHeader={true}
  >
    <Text id="formTitle4" markdown={true} />
    <Include src="./body4.rsx" />
    <Event
      id="5c7214cb"
      event="submit"
      method="trigger"
      params={{ ordered: [] }}
      pluginId="addEmpl"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="0bc611b6"
      event="invalid"
      method="open"
      params={{
        ordered: [
          { title: "Warning" },
          { description: "Please fill in all required data!" },
          {
            actionItems: [
              {
                ordered: [
                  { label: "OK" },
                  {
                    event: {
                      ordered: [
                        { event: "click" },
                        { method: "trigger" },
                        { pluginId: "" },
                        { type: "datasource" },
                        { waitMs: 0 },
                        { waitType: "debounce" },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        ],
      }}
      pluginId=""
      type="alert"
      waitMs="0"
      waitType="debounce"
    />
  </Form>
</Screen>
