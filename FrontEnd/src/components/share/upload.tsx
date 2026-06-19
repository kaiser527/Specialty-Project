import { useMessage } from "@/hooks/useMessage";
import { useUploadSingleFileMutation } from "@/redux/api/fileApi";
import { IImage } from "@/types/frontend";
import {
  LoadingOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import { Button, ConfigProvider, Modal, Upload } from "antd";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface IProps {
  dataImage: IImage[];
  setDataImage: (v: any) => void;
  folder: string;
  showList?: boolean;
  mode?: "multiple" | "single";
  renderChild?: "upload" | "button";
  allowUpload?: boolean;
}

const UploadImage = ({
  renderChild,
  showList,
  folder,
  dataImage,
  mode,
  setDataImage,
  allowUpload = true,
}: IProps) => {
  const [uploadFile, { isLoading }] = useUploadSingleFileMutation();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const { messageApi } = useMessage();

  const handleRemoveFile = (file: any) => {
    if (mode === "multiple") {
      setDataImage((prev: IImage[]) =>
        prev.filter((item) => item.uid !== file.uid)
      );
    } else {
      setDataImage([]);
    }
  };

  const getBase64 = (img: any, callback: any) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const handlePreview = async (file: any) => {
    if (!file.originFileObj) {
      setPreviewImage(file.url);
      setPreviewOpen(true);
      setPreviewTitle(
        file.name || file.url.substring(file.url.lastIndexOf("/") + 1)
      );
      return;
    }
    getBase64(file.originFileObj, (url: string) => {
      setPreviewImage(url);
      setPreviewOpen(true);
      setPreviewTitle(
        file.name || file.url.substring(file.url.lastIndexOf("/") + 1)
      );
    });
  };

  const beforeUpload = (file: any) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      messageApi.error("You can only upload JPG/PNG file!");
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      messageApi.error("Image must smaller than 5MB!");
    }
    return isJpgOrPng && isLt5M;
  };

  const handleUploadFileLogo = async ({ file, onSuccess, onError }: any) => {
    const res = await uploadFile({ file, folderType: folder }).unwrap();
    if (res && res.data) {
      const newImage: IImage = {
        name: res.data.fileName,
        uid: uuidv4(),
      };
      if (mode === "multiple") {
        setDataImage((prev: IImage[]) => [...prev, newImage]);
      } else {
        setDataImage([newImage]);
      }
      if (onSuccess) onSuccess("ok");
    } else {
      if (onError) {
        setDataImage([]);
        const error = new Error(res.message);
        onError({ event: error });
      }
    }
  };

  return (
    <>
      <ConfigProvider>
        <Upload
          showUploadList={showList === true}
          listType={renderChild === "upload" ? "picture-card" : undefined}
          multiple={mode === "multiple"}
          customRequest={handleUploadFileLogo}
          beforeUpload={beforeUpload}
          onRemove={(file) => handleRemoveFile(file)}
          onPreview={handlePreview}
          fileList={dataImage?.map((item) => ({
            uid: item.uid,
            name: item.name,
            status: "done",
            url: `${import.meta.env.VITE_BACKEND_URL}/images/${folder}/${
              item.name
            }`,
          }))}
        >
          {allowUpload && (
            <>
              {renderChild === "button" ? (
                <Button
                  loading={isLoading}
                  icon={isLoading ? <LoadingOutlined /> : <UploadOutlined />}
                >
                  Upload
                </Button>
              ) : (
                <div>
                  {isLoading ? <LoadingOutlined /> : <PlusOutlined />}
                  <div style={{ marginTop: 8 }}>Upload</div>
                </div>
              )}
            </>
          )}
        </Upload>
      </ConfigProvider>
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        style={{ zIndex: 1500 }}
      >
        <img alt="example" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </>
  );
};

export default UploadImage;
