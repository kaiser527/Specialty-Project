import { useEffect, useState } from "react";
import { Result } from "antd";
import { useGetAccount } from "@/hooks/useGetAccount";

interface IProps {
  hideChildren?: boolean;
  children: React.ReactNode;
  permission: { method: string; apiPath: string; module: string };
}

const Access = (props: IProps) => {
  const { permission, hideChildren = false } = props;
  const [allow, setAllow] = useState<boolean>(true);

  const { user } = useGetAccount();
  const permissions = user.permissions;

  useEffect(() => {
    if (permissions.length) {
      const check = permissions.find(
        (item) =>
          item.apiPath === permission.apiPath &&
          item.method === permission.method &&
          item.module === permission.module
      );
      if (check) {
        setAllow(true);
      } else setAllow(false);
    }
  }, [permissions]);

  return (
    <>
      {allow === true ? (
        <>{props.children}</>
      ) : (
        <>
          {hideChildren === false ? (
            <Result
              status="403"
              title="Access denied"
              subTitle="you don't have permission to access this resource"
            />
          ) : (
            <>{/* render nothing */}</>
          )}
        </>
      )}
    </>
  );
};

export default Access;
