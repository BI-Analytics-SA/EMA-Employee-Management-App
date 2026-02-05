<Screen
  id="peopleDetailsScreen"
  _customShortcuts={[]}
  _hashParams={[]}
  _searchParams={[]}
  events={[]}
  headerRightActions={[
    {
      ordered: [
        { type: "icon" },
        { value: "bold/interface-edit-write-1" },
        {
          event: {
            ordered: [
              { event: "click" },
              { method: "navigateTo" },
              { pluginId: "" },
              { type: "navigator" },
              { waitMs: 0 },
              { waitType: "debounce" },
              { params: { ordered: [{ screenPluginId: "emplDetails" }] } },
            ],
          },
        },
      ],
    },
  ]}
  padding={{
    ordered: [{ top: 0 }, { bottom: 0 }, { left: 12 }, { right: 12 }],
  }}
  title="Details"
  uuid="d4967631-3894-44e7-9c80-c51c6370c828"
>
  <Spacer id="spacer1" />
  <Button id="btnMedical" size="large" text="Medical">
    <Event
      id="f39c4331"
      event="click"
      method="navigateTo"
      params={{ map: { screenPluginId: "Medical_Questionnaire" } }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
  </Button>
  <Button id="button7" size="large" text="Contract">
    <Event
      id="4cdcbb59"
      event="click"
      method="navigateTo"
      params={{ ordered: [{ screenPluginId: "listOfContracts" }] }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
  </Button>
  <Button
    id="btnDeleteImage"
    hidden="{{ collectionView1.selectedItem.EmpURL === null }}"
    loading="{{ s3DeleteImage.isFetching || deleteImageURL.isFetching }}"
    size="large"
    style={{ ordered: [{ background: "rgba(147, 3, 3, 1)" }] }}
    text="Delete Image"
  >
    <Event
      id="9202c5c8"
      event="click"
      method="trigger"
      params={{ ordered: [] }}
      pluginId="s3DeleteImage"
      type="datasource"
      waitMs="0"
      waitType="debounce"
    />
  </Button>
  <Button
    id="btnCaptureImage"
    hidden="{{ collectionView1.selectedItem.EmpURL !== null }}"
    size="large"
    style={{ ordered: [{ background: "rgba(5, 145, 39, 1)" }] }}
    text="Capture Image"
  >
    <Event
      id="fedf97c4"
      event="click"
      method="navigateTo"
      params={{ ordered: [{ screenPluginId: "captureImageScreen" }] }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
  </Button>
  <Image
    id="image1"
    cornerType="square"
    ratio={1}
    src="{{collectionView1.selectedItem.EmpURL}}"
  />
  <KeyValue
    id="keyValue1"
    _rowKeysFormatted={{
      ordered: [
        { Date_Registered: "Date Registered" },
        { IDNumber: "ID Number" },
      ],
    }}
    _rowValuesFormatted={{
      ordered: [
        {
          Date_Registered:
            "{{ item === null?'Not Registered':moment(item).format('YYYY/MM/DD') }}",
        },
      ],
    }}
    allowTextWrapping={true}
    data="{{ collectionView1.selectedItem }}"
    rows={[
      "a",
      "b",
      "c",
      "pluginType",
      "cardStyle",
      "itemMode",
      "data",
      "prefixImageShapeByIndex",
      "titleByIndex",
      "subtitleByIndex",
      "prefixIconColorByIndex",
      "showSeparator",
      "serverPaginated",
      "selectedPageIndex",
      "cardType",
      "selectedIndex",
      "selectedItem",
      "prefixTypeByIndex",
      "suffixTypeByIndex",
      "prefixIconByIndex",
      "prefixImageSizeByIndex",
      "cardSize",
      "suffixIconByIndex",
      "scrollDirection",
      "prefixImageFitByIndex",
      "prefixImageSourceByIndex",
      "events",
      "bodyByIndex",
      "suffixValueByIndex",
      "suffixTextByIndex",
      "subtitleLengthByIndex",
      "id",
      "ID",
      "EmplNo",
      "Date_Registered",
      "FirstName",
      "LastName",
      "ShiftAlloc",
      "DeptGroup",
      "IDNumber",
      "LastDateWorked",
      "DateEngaged",
      "EmpURL",
      "FileName",
    ]}
    rowVisibility={{
      ordered: [
        { a: true },
        { cardStyle: true },
        { LastName: true },
        { b: true },
        { c: true },
        { prefixImageShapeByIndex: true },
        { titleByIndex: true },
        { subtitleByIndex: true },
        { prefixIconColorByIndex: true },
        { IDNumber: true },
        { EmplNo: true },
        { FileName: true },
        { EmpURL: true },
        { showSeparator: true },
        { selectedPageIndex: true },
        { cardType: true },
        { serverPaginated: true },
        { data: true },
        { pluginType: true },
        { selectedItem: true },
        { prefixTypeByIndex: true },
        { suffixTypeByIndex: true },
        { prefixIconByIndex: true },
        { prefixImageSizeByIndex: true },
        { cardSize: true },
        { suffixIconByIndex: true },
        { scrollDirection: true },
        { prefixImageFitByIndex: true },
        { Date_Registered: true },
        { ShiftAlloc: true },
        { LastDateWorked: true },
        { DateEngaged: true },
        { itemMode: true },
        { prefixImageSourceByIndex: true },
        { selectedIndex: true },
        { events: true },
        { bodyByIndex: true },
        { DeptGroup: false },
        { ID: true },
        { id: true },
        { FirstName: true },
        { suffixValueByIndex: true },
        { suffixTextByIndex: true },
        { subtitleLengthByIndex: true },
      ],
    }}
    showSeparator={true}
    valueHorizontalAlignment="right"
    valueWidth="50%"
  />
  <Button
    id="button6"
    loading="{{ deleteEmplDetails.isFetching || deleteImageURL.isFetching }}"
    size="large"
    style={{ ordered: [{ background: "rgba(247, 5, 5, 1)" }] }}
    text="Delete Empl"
  >
    <Event
      id="de78879d"
      event="click"
      method="open"
      params={{
        ordered: [
          { title: "Delete Employee" },
          {
            description: "Are you sure you would like to delete this employee.",
          },
          {
            actionItems: [
              {
                ordered: [
                  { label: "YES" },
                  {
                    event: {
                      ordered: [
                        { event: "click" },
                        { method: "run" },
                        { pluginId: "" },
                        { type: "script" },
                        { waitMs: 0 },
                        { waitType: "debounce" },
                        {
                          params: {
                            ordered: [
                              {
                                src: "await s3DeleteImage.trigger();\nawait deleteEmplDetails.trigger();",
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
              {
                ordered: [
                  { label: "NO" },
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
  </Button>
</Screen>
