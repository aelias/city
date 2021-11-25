export const APIErrors  = {
    NoContentTypeHeader:  {
        status: 400,
        message: 'No content-type header defined in call'
    },
    NoExpectedContentTypeHeader:  {
        status: 400,
        message: 'No expected content-type present in call'
    },
    NotANumber: {
        status: 400,
        message: 'n is not a number'
    },
    NGreaterThanWords: {
        status: 400,
        message: 'n is greater than the amount of words in the file'
    },
    NoFileUploaded: {
      status: 400,
      message: 'no file being uploaded'
    },
    FileSizeLimitExceeded: {
        status: 400,
        message: 'file size limit exceeded'
    }
}
