<Screen
  id="emplDetails"
  _customShortcuts={[]}
  _hashParams={[]}
  _searchParams={[]}
  title="Employee Details"
  uuid="a167d4a1-5a17-499e-8ef2-99bb23c7dd48"
>
  <Frame
    id="$main4"
    enableFullBleed={false}
    isHiddenOnDesktop={false}
    isHiddenOnMobile={false}
    padding="8px 12px"
    sticky={null}
    type="main"
  />
  <Form
    id="formComponent3"
    enableFullBleed="false"
    initialData="{{ employeeDetails.data }}"
    layout="column"
    padding={{ object: {} }}
    requireValidation={true}
    resetAfterSubmit={true}
    scroll={true}
    showBody={true}
    showFooter={true}
    showHeader={true}
  >
    <Text id="formTitle3" markdown={true} />
    <Include src="./body3.rsx" />
    <Event
      id="7d96916e"
      event="submit"
      method="trigger"
      params={{ ordered: [] }}
      pluginId="submitEmplDetailsDev"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
    <Event
      id="a4b26d76"
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
