<Screen
  id="captureImageScreen"
  _customShortcuts={[]}
  _hashParams={[]}
  _searchParams={[]}
  title="CaptureImage"
  uuid="47b1a3c9-30f9-4fc3-827a-35e68f4b0e16"
>
  <Frame
    id="$main"
    enableFullBleed={false}
    isHiddenOnDesktop={false}
    isHiddenOnMobile={false}
    padding="8px 12px"
    sticky={null}
    type="main"
  />
  <ImageInput
    id="imageInput1"
    label=""
    launchMode="cameraOnly"
    placeholder="Click here to Capture Image"
    resolution="medium"
    selectionType="single"
    shouldCompress={true}
  />
  <Button
    id="button2"
    loading="{{ s3UploadImage.isFetching || addImageURL.isFetching }}"
    size="large"
    text="Upload Image"
  >
    <Event
      id="b2b2f653"
      event="click"
      method="open"
      params={{
        ordered: [
          { title: "Upload Image" },
          {
            description:
              "Please make sure you have taken a picture before uploading. If you are happy to continue, click ok.",
          },
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
                        { pluginId: "s3UploadImage" },
                        { type: "datasource" },
                        { waitMs: 0 },
                        { waitType: "debounce" },
                      ],
                    },
                  },
                ],
              },
              {
                ordered: [
                  { label: "Cancel" },
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
