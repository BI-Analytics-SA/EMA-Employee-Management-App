<Screen
  id="peopleListScreen"
  _customShortcuts={[]}
  _hashParams={[]}
  _searchParams={[]}
  title="Carara Empl Registration"
  uuid="aaebe09e-7721-4637-8c61-f17f2aef6db4"
>
  <Container
    id="container7"
    align="flex-end"
    cornerType="square"
    gap={12}
    justify="center"
    layout="column"
    padding={{
      ordered: [{ left: 0 }, { right: 0 }, { top: 0 }, { bottom: 0 }],
    }}
    showBody={true}
    widthGrowFactor={1}
  >
    <TextArea
      id="textInput1"
      iconAfter="bold/interface-arrows-down-circle-1"
      label="Search for an ID Number"
      maxLength="13"
      minLength="13"
      minLines={1}
      placeholder="Enter value"
    >
      <Event
        id="cbf959e5"
        event="submit"
        method="trigger"
        params={{ ordered: [] }}
        pluginId="getRows"
        type="datasource"
        waitMs="0"
        waitType="debounce"
      />
      <Event
        id="4062a209"
        event="suffixIconPress"
        method="trigger"
        params={{ ordered: [] }}
        pluginId="getRows"
        type="datasource"
        waitMs="0"
        waitType="debounce"
      />
    </TextArea>
    <Scanner
      id="scanner1"
      autoClose={true}
      buttonSize="large"
      buttonText="Scan for ID Number"
      data="[]"
      ratio={1}
      width="fixed"
    >
      <Event
        id="acb44293"
        event="capture"
        method="setValue"
        params={{ ordered: [{ value: "{{ scanner1.data[0] }}" }] }}
        pluginId="textInput1"
        type="widget"
        waitMs="0"
        waitType="debounce"
      />
    </Scanner>
  </Container>
  <CollectionView
    id="collectionView1"
    bodyByIndex="{{item.IDNumber}}"
    cardSize="half"
    cardStyle="elevated"
    data="{{getRows.data}}"
    prefixIconByIndex="bold/interface-user-single"
    prefixIconColorByIndex=""
    prefixImageFitByIndex="cover"
    prefixImageShapeByIndex="square"
    prefixImageSizeByIndex="1 to 1"
    prefixImageSourceByIndex="{{item.EmpURL}}"
    prefixTypeByIndex="image"
    showSeparator={true}
    subtitleByIndex="{{item.LastName}}"
    subtitleLengthByIndex={2}
    suffixIconByIndex={
      '   {{ item.Date_Registered !== null? "/icon:bold/interface-validation-check" :"/icon:bold/interface-delete-2" }}'
    }
    suffixTextByIndex="Registered"
    suffixTypeByIndex="text+icon"
    suffixValueByIndex="false"
    titleByIndex="{{item.FirstName}}"
  >
    <Event
      id="1734b13e"
      event="press"
      method="navigateTo"
      params={{
        ordered: [
          { screenPluginId: "peopleDetailsScreen" },
          { detailSplitView: false },
          { splitViewRatio: 0.5 },
        ],
      }}
      type="navigator"
    />
  </CollectionView>
  <Button
    id="button4"
    hidden="{{ collectionView1.data.length > 0 }}"
    size="large"
    text="Add New Empl"
  >
    <Event
      id="8ae98a10"
      event="click"
      method="navigateTo"
      params={{ ordered: [{ screenPluginId: "addEmplScreen" }] }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
  </Button>
</Screen>
