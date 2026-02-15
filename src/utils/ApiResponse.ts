export class ApiResponse {
  public static success(res: any, data: any = null, message: string = 'Success', statusCode: number = 200, code: string = 'SUCCESS') {
    return res.status(statusCode).json({
      success: true,
      message,
      code,
      data,
    });
  }

  public static error(res: any, message: string = 'Error', statusCode: number = 500, code: string = 'ERROR', error: any = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      code,
      error: process.env.NODE_ENV === 'development' ? error : undefined,
    });
  }
}
