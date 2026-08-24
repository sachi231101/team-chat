export declare class AttachmentsController {
    upload(file: Express.Multer.File): {
        name: string;
        size: number;
        type: string;
        url: string;
    };
}
