<MobileApp>
  <Include src="./functions.rsx" />
  <TabScreen
    id="tabscreen"
    items={[
      {
        ordered: [
          { screen: "peopleListScreen" },
          { icon: "bold/interface-text-formatting-list-bullets" },
        ],
      },
    ]}
  />
  <Include src="./src/peopleListScreen.rsx" />
  <Include src="./src/peopleDetailsScreen.rsx" />
  <Include src="./src/captureImageScreen.rsx" />
  <Include src="./src/emplDetails.rsx" />
  <Include src="./src/addEmplScreen.rsx" />
  <Include src="./src/listOfContracts.rsx" />
  <Include src="./src/newContractScreen.rsx" />
  <Include src="./src/formScreen.rsx" />
  <Include src="./src/Medical_Questionnaire.rsx" />
  <Include src="./src/New_Medical_Quest.rsx" />
  <Include src="./src/Edit_Medical_Quest.rsx" />
</MobileApp>
