<Screen
  id="listOfContracts"
  _customShortcuts={[]}
  _hashParams={[]}
  _searchParams={[]}
  title="List of Contracts"
  uuid="6eac0a3b-a1cf-439e-b4e7-01af6efb3dd6"
>
  <Frame
    id="$main6"
    enableFullBleed={false}
    isHiddenOnDesktop={false}
    isHiddenOnMobile={false}
    padding="8px 12px"
    sticky={null}
    type="main"
  />
  <CollectionView
    id="listCollection1"
    bodyByIndex=""
    data="{{ emplContract.data }}"
    prefixIconByIndex="bold/interface-upload-button-1"
    prefixIconColorByIndex=""
    prefixImageFitByIndex="cover"
    prefixImageShapeByIndex="square"
    prefixImageSizeByIndex="1 to 1"
    prefixImageSourceByIndex=""
    prefixTypeByIndex="icon"
    showSeparator={true}
    subtitleByIndex="Empl Number : {{ item.EmplNo}}  ID No : {{ item.ID_Number }}"
    subtitleLengthByIndex="2"
    suffixIconByIndex=""
    suffixTextByIndex="Edit"
    suffixTypeByIndex="none"
    suffixValueByIndex="false"
    titleByIndex="Season : {{ item.Season }}"
  />
  <Button id="button8" size="large" text="Add New Contract">
    <Event
      id="fc00b4e0"
      event="click"
      method="navigateTo"
      params={{ ordered: [{ screenPluginId: "formScreen" }] }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
  </Button>
</Screen>
