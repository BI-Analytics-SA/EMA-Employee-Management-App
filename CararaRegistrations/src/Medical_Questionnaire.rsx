<Screen
  id="Medical_Questionnaire"
  _customShortcuts={[]}
  _hashParams={[]}
  _searchParams={[]}
  browserTitle={null}
  title="Medical"
  urlSlug={null}
  uuid="3cfd78ea-56dc-4400-a9d7-7923d316a4fc"
>
  <Spacer id="spacer3" height={4} />
  <Button
    id="button9"
    hidden="{{ medical_questions.data.ID.length > 0 }}"
    size="large"
    text="New"
  >
    <Event
      id="ce3263ef"
      event="click"
      method="navigateTo"
      params={{ map: { screenPluginId: "New_Medical_Quest" } }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
  </Button>
  <Button
    id="button10"
    hidden="{{ !medical_questions.data.ID.length > 0 }}"
    size="large"
    text="Edit / View"
  >
    <Event
      id="11aa168e"
      event="click"
      method="navigateTo"
      params={{ map: { screenPluginId: "Edit_Medical_Quest" } }}
      pluginId=""
      type="navigator"
      waitMs="0"
      waitType="debounce"
    />
  </Button>
</Screen>
